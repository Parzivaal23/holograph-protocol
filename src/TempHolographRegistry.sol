// SPDX-License-Identifier: UNLICENSED

/*SOLIDITY_COMPILER_VERSION*/

contract TempHolographRegistry {
  address[] private _holographableContracts;
  mapping(bytes32 => address) private _holographedContractsHashMap;
  mapping(bytes32 => address) private _contractTypeAddresses;
  mapping(bytes32 => bool) private _reservedTypes;
  mapping(address => bool) private _holographedContracts;
  mapping(uint32 => address) private _hTokens;

  constructor() {}

  function removeHolographedContract(address[] memory smartContracts) external returns (bool) {
    require(msg.sender == 0x6429b42da2a06aA1C46710509fC96E846F46181e, "Holograph adminCall only");
    uint256 l = smartContracts.length;
    for (uint256 i = 0; i < l; i++) {
      address smartContract = smartContracts[i];
      delete (_holographedContracts[smartContract]);
    }
    return true;
  }
}
