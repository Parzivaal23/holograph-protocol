// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

/// @notice Sales states and configuration
/// @dev Uses 2 storage slots
struct CustomERC721SalesConfiguration {
  /// @dev Public sale price (max ether value > 1000 ether with this value)
  uint104 publicSalePrice;
  /// @notice Purchase mint limit per address (if set to 0 === unlimited mints)
  /// @dev Max purchase number per txn (90+32 = 122)
  uint24 maxSalePurchasePerAddress;
  /// @notice Presale start timestamp
  /// @dev new storage slot
  uint64 presaleStart;
  /// @notice Presale end timestamp
  uint64 presaleEnd;
  /// @notice Presale merkle root
  bytes32 presaleMerkleRoot;
}
