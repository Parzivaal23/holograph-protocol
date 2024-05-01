// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import {ERC721H} from "../abstract/ERC721H.sol";
import {NonReentrant} from "../abstract/NonReentrant.sol";
import {ContractMetadata} from "../abstract/ContractMetadata.sol";

import {HolographERC721Interface} from "../interface/HolographERC721Interface.sol";
import {HolographerInterface} from "../interface/HolographerInterface.sol";
import {HolographInterface} from "../interface/HolographInterface.sol";
import {ICustomERC721} from "../interface/ICustomERC721.sol";
import {IDropsPriceOracle} from "../drops/interface/IDropsPriceOracle.sol";
import {HolographTreasuryInterface} from "../interface/HolographTreasuryInterface.sol";

import {AddressMintDetails} from "../drops/struct/AddressMintDetails.sol";
import {CountdownERC721Initializer} from "src/struct/CountdownERC721Initializer.sol";
import {CustomERC721SaleDetails} from "src/struct/CustomERC721SaleDetails.sol";
import {CustomERC721SalesConfiguration} from "src/struct/CustomERC721SalesConfiguration.sol";
import {MetadataParams} from "src/struct/MetadataParams.sol";

import {Address} from "../drops/library/Address.sol";
import {MerkleProof} from "../drops/library/MerkleProof.sol";
import {Strings} from "./../drops/library/Strings.sol";
import {NFTMetadataRenderer} from "../library/NFTMetadataRenderer.sol";

/**
 * @dev This contract subscribes to the following HolographERC721 events:
 *       - customContractURI
 *
 *       Do not enable or subscribe to any other events unless you modified the source code for them.
 */
contract CountdownERC721 is NonReentrant, ContractMetadata, ERC721H, ICustomERC721 {
  using Strings for uint256;

  // TODO: Update the base image URI
  string private constant BASE_IMAGE_URI = "ipfs://QmNMraA4KcB1epgWfqN6krn2WUyT4qpaQzbEpMhXjBCNCW/nft.png";
  string private constant BASE_ANIMATION_URI = ""; // Define if you have a specific animation URI

  /* -------------------------------------------------------------------------- */
  /*                             CONTRACT VARIABLES                             */
  /*        all variables, without custom storage slots, are defined here       */
  /* -------------------------------------------------------------------------- */

  /// @notice Getter for the description
  /// @dev This storage variable is set only once in the init and can be considered as immutable
  string public DESCRIPTION;

  /// @notice Getter for the purchase start date
  /// @dev This storage variable is set only once in the init and can be considered as immutable
  uint256 public START_DATE;

  /// @notice Getter for the initial max supply
  /// @dev This storage variable is set only once in the init and can be considered as immutable
  uint256 public INITIAL_MAX_SUPPLY;

  /// @notice Getter for the mint interval
  /// @dev This storage variable is set only once in the init and can be considered as immutable
  uint256 public MINT_INTERVAL;

  /// @notice Getter for the mint interval
  /// @dev This storage variable is set only once in the init and can be considered as immutable
  address payable FUNDS_RECIPIENT;

  /// @notice Getter for the initial end date
  /// @dev This storage variable is set only once in the init and can be considered as immutable
  uint256 public INITIAL_END_DATE;

  /// @notice Getter for the end date
  uint256 public END_DATE;

  /// @notice Getter for the minter
  /// @dev This account tokens on behalf of those that purchase them offchain
  address public minter;

  /**
   * @dev Address of the price oracle proxy
   */
  IDropsPriceOracle public constant dropsPriceOracle = IDropsPriceOracle(0xeA7f4C52cbD4CF1036CdCa8B16AcA11f5b09cF6E);

  /**
   * @dev Internal reference used for minting incremental token ids.
   */
  uint224 private _currentTokenId;

  /**
   * @dev Internal reference to the base URI
   */
  string private _baseURI;

  /// @dev Gas limit for transferring funds
  uint256 private constant STATIC_GAS_LIMIT = 210_000;

  /**
   * @notice Sales configuration
   */
  CustomERC721SalesConfiguration public salesConfig;

  /**
   * @dev Mapping for the total mints by address
   */
  mapping(address => uint256) public totalMintsByAddress;

  /* -------------------------------------------------------------------------- */
  /*                                  MODIFIERS                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * @notice Allows only the minter to call the function
   */
  modifier onlyMinter() {
    if (msgSender() != minter) {
      revert Access_OnlyMinter();
    }
    _;
  }

  /**
   * @notice Allows user to mint tokens at a quantity
   */
  modifier canMintTokens(uint256 quantity) {
    /// @dev Check if the countdown has completed
    ///      END_DATE - MINT_INTERVAL * (quantity - 1) represent the time when the last mint will be allowed
    ///      (quantity - 1) because we want to allow the last mint to be available until the END_DATE
    if (block.timestamp >= END_DATE - MINT_INTERVAL * (quantity - 1)) {
      revert Purchase_CountdownCompleted();
    }

    _;
  }

  /**
   * @notice Public sale active
   */
  modifier onlyPublicSaleActive() {
    if (!_publicSaleActive()) {
      revert Sale_Inactive();
    }
    _;
  }

  /* -------------------------------------------------------------------------- */
  /*                            CONTRACT INITIALIZERS                           */
  /* -------------------------------------------------------------------------- */

  /**
   * @dev Constructor is left empty and init is used instead
   */
  constructor() {}

  /**
   * @notice Used internally to initialize the contract instead of through a constructor
   * @dev This function is called by the deployer/the factory when creating a contract
   * @param initPayload abi encoded payload (CountdownERC721Initializer struct) to use for contract initilaization
   */
  function init(bytes memory initPayload) external override returns (bytes4) {
    require(!_isInitialized(), "HOLOGRAPH: already initialized");

    // Enable sourceExternalCall to work on init, we set holographer here since it's only set after init
    assembly {
      sstore(_holographerSlot, caller())
    }

    // Decode the initializer payload to get the CountdownERC721Initializer struct
    CountdownERC721Initializer memory initializer = abi.decode(initPayload, (CountdownERC721Initializer));

    _setupContractURI(initializer.contractURI);

    // Setup the owner role
    _setOwner(initializer.initialOwner);

    // Setup the minter role
    _setMinter(initializer.initialMinter);

    // Setup the contract URI

    // Set the description
    /// @dev The description is a human-readable description of the token.
    ///      The description is used like an immutable.
    DESCRIPTION = initializer.description;

    // Set the sale start date.
    /// @dev The sale start date represents the date when the public sale starts.
    ///      The sale start date is used like an immutable.
    START_DATE = initializer.startDate;

    // Set the initial max supply.
    /// @dev The initial max supply represents the theoretical maximum supply at the start date timestamp.
    ///      The sale start date is used like an immutable.
    INITIAL_MAX_SUPPLY = initializer.initialMaxSupply;

    // Set the mint interval.
    /// @dev The mint interval specifies the duration by which the END_DATE is decreased after each mint operation.
    ///      The sale start date is used like an immutable.
    MINT_INTERVAL = initializer.mintInterval;

    // Set the funds recipient
    /// @dev The funds recipient is the address that receives the funds from the token sales.
    ///      The funds recipient can be updated by the owner.
    FUNDS_RECIPIENT = initializer.fundsRecipient;

    // Set the end dates
    /// @dev The END_DATE is calculated by adding the initial max supply times the mint interval to the start date.
    ///      The END_DATE is decreased after each mint operation by the mint interval.
    uint256 endDate = initializer.startDate + initializer.initialMaxSupply * initializer.mintInterval;
    END_DATE = endDate;
    /// @dev The sale start date is used like an immutable.
    INITIAL_END_DATE = endDate;

    // Set the sales configuration
    salesConfig = initializer.salesConfiguration;

    setStatus(1);

    return _init(initPayload);
  }

  /* -------------------------------------------------------------------------- */
  /*                     PUBLIC NON STATE CHANGING FUNCTIONS                    */
  /*                                   static                                   */
  /* -------------------------------------------------------------------------- */

  /**
   * @notice Returns the version of the contract
   * @dev Used for contract versioning and validation
   * @return version of the contract
   */
  function version() external pure returns (uint32) {
    return 1;
  }

  function supportsInterface(bytes4 interfaceId) external pure override returns (bool) {
    return interfaceId == type(ICustomERC721).interfaceId;
  }

  /* -------------------------------------------------------------------------- */
  /*                     PUBLIC NON STATE CHANGING FUNCTIONS                    */
  /*                                   dynamic                                  */
  /* -------------------------------------------------------------------------- */

  function owner() external view override(ERC721H, ICustomERC721) returns (address) {
    return _getOwner();
  }

  function isAdmin(address user) external view returns (bool) {
    return (_getOwner() == user);
  }

  /**
   * @notice Returns the theoretical maximum supply for the current time
   * @dev The max supply is calculated based on the current time and the mint interval, by subtracting
   *      the elapsed_mint intervals from the initial max supply.
   *      - The max supply is the initial max supply if the current time is less than the start date.
   *      - The max supply is zero if the current time is greater than the end date.
   *      - The max supply is decreased by one for each mint interval that has passed.
   *      - The max supply is calculated by subtracting the intervals elapsed from the initial max supply.
   * @return max supply
   */
  function currentTheoricalMaxSupply() public view returns (uint256) {
    if (block.timestamp <= START_DATE) {
      return INITIAL_MAX_SUPPLY;
    } else if (block.timestamp >= START_DATE + INITIAL_MAX_SUPPLY * MINT_INTERVAL) {
      return 0; // All intervals have elapsed
    } else {
      // EVM division is floored
      uint256 intervalsElapsed = (block.timestamp - START_DATE) / MINT_INTERVAL;
      return INITIAL_MAX_SUPPLY - intervalsElapsed;
    }
  }

  /**
   * @notice Returns the total amount of tokens minted in the contract.
   */
  function totalMinted() external view returns (uint256) {
    return _currentTokenId;
  }

  /**
   * @notice Sale details
   * @dev Returns the sale details for the contract
   * @return SaleDetails sale information details
   */
  function saleDetails() external view returns (CustomERC721SaleDetails memory) {
    return
      CustomERC721SaleDetails({
        publicSaleActive: _publicSaleActive(), // Based on the current time
        publicSalePrice: salesConfig.publicSalePrice, // Can be updated by the owner
        maxSalePurchasePerAddress: salesConfig.maxSalePurchasePerAddress, // Can be updated by the owner
        publicSaleStart: START_DATE, // Immutable
        totalMinted: _currentTokenId, // Updated after each mint
        maxSupply: currentTheoricalMaxSupply() // Updated after each mint or after each interval
      });
  }

  /**
   * @dev Number of NFTs the user has minted per address
   * @param minter to get counts for
   */
  function mintedPerAddress(address minter) external view returns (AddressMintDetails memory) {
    return
      AddressMintDetails({
        presaleMints: 0, // NOTE: Presale mints are not supported
        publicMints: totalMintsByAddress[minter],
        totalMints: totalMintsByAddress[minter]
      });
  }

  /**
   * @dev Returns a base64 encoded metadata URI for a given tokenId.
   * @param tokenId The ID of the token to get URI for
   * @return Token URI
   */
  function tokenURI(uint256 tokenId) public view returns (string memory) {
    HolographERC721Interface H721 = HolographERC721Interface(holographer());
    require(H721.exists(tokenId), "ERC721: token does not exist");

    string memory _name = H721.name();
    MetadataParams memory params = MetadataParams({
      name: _name,
      description: DESCRIPTION,
      imageURI: BASE_IMAGE_URI,
      animationURI: BASE_ANIMATION_URI,
      externalUrl: "https://your-nft-project.com", // This should be dynamically set or fetched
      encryptedMediaUrl: "ar://encryptedMediaUriHere", // This should be dynamically set or fetched
      decryptionKey: "decryptionKeyHere", // This should be dynamically set or fetched
      hash: "uniqueNftHashHere", // This should be dynamically set or fetched
      decryptedMediaUrl: "ar://decryptedMediaUriHere", // This should be dynamically set or fetched
      tokenOfEdition: tokenId,
      editionSize: 0 // Set or fetch dynamically if applicable
    });

    return NFTMetadataRenderer.createMetadataEdition(params);
  }

  /**
   * @notice Convert USD price to current price in native Ether units
   */
  function getNativePrice() external view returns (uint256) {
    return _usdToWei(salesConfig.publicSalePrice);
  }

  /**
   * @notice Returns the name of the token through the holographer entrypoint
   */
  function name() external view returns (string memory) {
    return HolographERC721Interface(holographer()).name();
  }

  /* -------------------------------------------------------------------------- */
  /*                       PUBLIC STATE CHANGING FUNCTIONS                      */
  /*                              available to all                              */
  /* -------------------------------------------------------------------------- */

  function multicall(bytes[] memory data) public returns (bytes[] memory results) {
    results = new bytes[](data.length);
    for (uint256 i = 0; i < data.length; i++) {
      results[i] = Address.functionDelegateCall(address(this), abi.encodePacked(data[i], msgSender()));
    }
  }

  /**
   * @dev This allows the user to purchase/mint a edition at the given price in the contract.
   * @param quantity quantity to purchase
   */
  function purchase(
    uint256 quantity
  ) external payable nonReentrant canMintTokens(quantity) onlyPublicSaleActive returns (uint256) {
    uint256 salePrice = _usdToWei(salesConfig.publicSalePrice);

    if (msg.value < (salePrice) * quantity) {
      // The error will display what the correct price should be
      revert Purchase_WrongPrice((salesConfig.publicSalePrice) * quantity);
    }

    // Reducing the end date by removing the quantity of mints times the mint interval
    END_DATE = END_DATE - quantity * MINT_INTERVAL;

    uint256 remainder = msg.value - (salePrice * quantity);

    // If max purchase per address == 0 there is no limit.
    // Any other number, the per address mint limit is that.
    if (
      salesConfig.maxSalePurchasePerAddress != 0 &&
      totalMintsByAddress[msgSender()] + quantity > salesConfig.maxSalePurchasePerAddress
    ) {
      revert Purchase_TooManyForAddress();
    }

    // First mint the NFTs
    _mintNFTs(msgSender(), quantity);

    HolographERC721Interface H721 = HolographERC721Interface(holographer());
    uint256 chainPrepend = H721.sourceGetChainPrepend();
    uint256 firstMintedTokenId = (chainPrepend + uint256(_currentTokenId - quantity)) + 1;

    emit Sale({
      to: msgSender(),
      quantity: quantity,
      pricePerToken: salePrice,
      firstPurchasedTokenId: firstMintedTokenId
    });

    // Refund any overpayment
    if (remainder > 0) {
      msgSender().call{value: remainder, gas: gasleft() > STATIC_GAS_LIMIT ? STATIC_GAS_LIMIT : gasleft()}("");
    }

    return firstMintedTokenId;
  }

  /* -------------------------------------------------------------------------- */
  /*                       PUBLIC STATE CHANGING FUNCTIONS                      */
  /*                                 admin only                                 */
  /* -------------------------------------------------------------------------- */

  /**
   * @notice Minter account mints tokens to a recipient that has paid offchain
   * @param recipient recipient to mint to
   * @param quantity quantity to mint
   */
  function mintTo(address recipient, uint256 quantity) external onlyMinter canMintTokens(quantity) returns (uint256) {
    _mintNFTs(recipient, quantity);

    return _currentTokenId;
  }

  /**
   * @dev This sets the sales configuration
   * @param publicSalePrice New public sale price
   * @param maxSalePurchasePerAddress Max # of purchases (public) per address allowed
   */
  function setSaleConfiguration(uint104 publicSalePrice, uint24 maxSalePurchasePerAddress) external onlyOwner {
    salesConfig.publicSalePrice = publicSalePrice;
    salesConfig.maxSalePurchasePerAddress = maxSalePurchasePerAddress;

    emit SalesConfigChanged(msgSender());
  }

  /**
   * @notice Set a different funds recipient
   * @param newRecipientAddress new funds recipient address
   */
  function setFundsRecipient(address payable newRecipientAddress) external onlyOwner {
    if (newRecipientAddress == address(0)) {
      revert("Funds Recipient cannot be 0 address");
    }
    FUNDS_RECIPIENT = newRecipientAddress;
    emit FundsRecipientChanged(newRecipientAddress, msgSender());
  }

  /**
   * @notice This withdraws native tokens from the contract to the contract owner.
   */
  function withdraw() external override nonReentrant {
    if (FUNDS_RECIPIENT == address(0)) {
      revert("Funds Recipient address not set");
    }
    address sender = msgSender();

    // Get the contract balance
    uint256 funds = address(this).balance;

    // Check if withdraw is allowed for sender
    if (sender != FUNDS_RECIPIENT && sender != _getOwner()) {
      revert Access_WithdrawNotAllowed();
    }

    // Payout recipient
    (bool successFunds, ) = FUNDS_RECIPIENT.call{value: funds, gas: STATIC_GAS_LIMIT}("");
    if (!successFunds) {
      revert Withdraw_FundsSendFailure();
    }

    // Emit event for indexing
    emit FundsWithdrawn(sender, FUNDS_RECIPIENT, funds);
  }

  /**
   * @notice Set the minter address
   * @param minterAddress new minter address
   */
  function setMinter(address minterAddress) external onlyOwner {
    _setMinter(minterAddress);
  }

  function setOwner(address newOwner) external {
    _setOwner(newOwner);
  }

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /*                             non state changing                             */
  /* -------------------------------------------------------------------------- */

  /**
   * @dev Internal function to return the base URI stored in the contract.
   * Used to construct the URI for each token.
   */
  function baseURI() internal view returns (string memory) {
    return _baseURI;
  }

  /// @notice Checks whether contract metadata can be set in the given execution context.
  function _canSetContractURI() internal view override returns (bool) {
    return msgSender() == _getOwner();
  }

  /**
   * @dev Checks if the public sale is active
   */
  function _publicSaleActive() internal view returns (bool) {
    return START_DATE <= block.timestamp;
  }

  /**
   * @dev Converts the given amount in USD to the equivalent amount in wei using the price oracle.
   * @param amount The amount in USD to convert to wei
   */
  function _usdToWei(uint256 amount) internal view returns (uint256 weiAmount) {
    if (amount == 0) {
      return 0;
    }
    weiAmount = dropsPriceOracle.convertUsdToWei(amount);
  }

  /* -------------------------------------------------------------------------- */
  /*                             INTERNAL FUNCTIONS                             */
  /*                               state changing                               */
  /* -------------------------------------------------------------------------- */

  function _mintNFTs(address recipient, uint256 quantity) internal {
    HolographERC721Interface H721 = HolographERC721Interface(holographer());
    uint256 chainPrepend = H721.sourceGetChainPrepend();
    uint224 tokenId = 0;

    for (uint256 i = 0; i != quantity; ) {
      unchecked {
        _currentTokenId += 1;
      }
      while (
        H721.exists(chainPrepend + uint256(_currentTokenId)) || H721.burned(chainPrepend + uint256(_currentTokenId))
      ) {
        unchecked {
          _currentTokenId += 1;
        }
      }
      tokenId = _currentTokenId;
      H721.sourceMint(recipient, tokenId);

      uint256 id = chainPrepend + uint256(tokenId);
      emit NFTMinted(recipient, tokenId, id);

      unchecked {
        i++;
      }
    }
  }

  /**
   * @dev Set the minter address
   * @param minterAddress new minter address
   */
  function _setMinter(address minterAddress) internal {
    minter = minterAddress;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Fallback                                  */
  /* -------------------------------------------------------------------------- */

  fallback() external payable override {
    assembly {
      // Allocate memory for the error message
      let errorMsg := mload(0x40)

      // Error message: "Function not found", properly padded with zeroes
      mstore(errorMsg, 0x46756e6374696f6e206e6f7420666f756e640000000000000000000000000000)

      // Revert with the error message
      revert(errorMsg, 20) // 20 is the length of the error message in bytes
    }
  }
}
