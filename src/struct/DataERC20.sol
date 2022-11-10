/*HOLOGRAPH_LICENSE_HEADER*/

/*SOLIDITY_COMPILER_VERSION*/

struct DataERC20 {
  uint256 _balances;
  uint256 _nonces;
  mapping(address => mapping(address => uint256)) _allowances;
}
