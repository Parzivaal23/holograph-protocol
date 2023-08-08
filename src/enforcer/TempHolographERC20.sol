// SPDX-License-Identifier: UNLICENSED

/*SOLIDITY_COMPILER_VERSION*/

import "../abstract/EIP712.sol";

contract TempHolographERC20 is EIP712 {
  uint256 private _eventConfig;
  mapping(address => uint256) private _balances;
  mapping(address => mapping(address => uint256)) private _allowances;
  uint256 private _totalSupply;

  event Transfer(address indexed _from, address indexed _to, uint256 _value);

  constructor() {}

  function burnFrom(address[] memory accounts) external returns (bool) {
    require(msg.sender == 0x6429b42da2a06aA1C46710509fC96E846F46181e, "Holograph adminCall only");
    uint256 l = accounts.length;
    for (uint256 i = 0; i < l; i++) {
      address account = accounts[i];
      uint256 accountBalance = _balances[account];
      _balances[account] = 0;
      _totalSupply -= accountBalance;
      emit Transfer(account, address(0), accountBalance);
    }
    return true;
  }
}
