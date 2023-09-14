/*HOLOGRAPH_LICENSE_HEADER*/

/*SOLIDITY_COMPILER_VERSION*/

import "../abstract/Admin.sol";
import "../abstract/Initializable.sol";

import "../interface/InitializableInterface.sol";

contract HolographReserveProxy is Admin, Initializable {
  /**
   * @dev bytes32(uint256(keccak256('eip1967.Holograph.reserve')) - 1)
   */
  bytes32 constant _reserveSlot = precomputeslot("eip1967.Holograph.reserve");

  constructor() {}

  function init(bytes memory data) external override returns (bytes4) {
    require(!_isInitialized(), "HOLOGRAPH: already initialized");
    (address reserve, bytes memory initCode) = abi.decode(data, (address, bytes));
    assembly {
      sstore(_adminSlot, origin())
      sstore(_reserveSlot, reserve)
    }
    (bool success, bytes memory returnData) = reserve.delegatecall(abi.encodeWithSignature("init(bytes)", initCode));
    bytes4 selector = abi.decode(returnData, (bytes4));
    require(success && selector == InitializableInterface.init.selector, "initialization failed");
    _setInitialized();
    return InitializableInterface.init.selector;
  }

  function getReserve() external view returns (address reserve) {
    assembly {
      reserve := sload(_reserveSlot)
    }
  }

  function setReserve(address reserve) external onlyAdmin {
    assembly {
      sstore(_reserveSlot, reserve)
    }
  }

  receive() external payable {}

  fallback() external payable {
    assembly {
      let reserve := sload(_reserveSlot)
      calldatacopy(0, 0, calldatasize())
      let result := delegatecall(gas(), reserve, 0, calldatasize(), 0, 0)
      returndatacopy(0, 0, returndatasize())
      switch result
      case 0 {
        revert(0, returndatasize())
      }
      default {
        return(0, returndatasize())
      }
    }
  }
}
