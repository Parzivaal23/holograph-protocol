// SPDX-License-Identifier: MIT

pragma solidity 0.8.13;

import {MetadataParams} from "../struct/MetadataParams.sol";

library Math {
  enum Rounding {
    Down, // Toward negative infinity
    Up, // Toward infinity
    Zero // Toward zero
  }

  /**
   * @dev Returns the largest of two numbers.
   */
  function max(uint256 a, uint256 b) internal pure returns (uint256) {
    return a > b ? a : b;
  }

  /**
   * @dev Returns the smallest of two numbers.
   */
  function min(uint256 a, uint256 b) internal pure returns (uint256) {
    return a < b ? a : b;
  }

  /**
   * @dev Returns the average of two numbers. The result is rounded towards
   * zero.
   */
  function average(uint256 a, uint256 b) internal pure returns (uint256) {
    // (a + b) / 2 can overflow.
    return (a & b) + (a ^ b) / 2;
  }

  /**
   * @dev Returns the ceiling of the division of two numbers.
   *
   * This differs from standard division with `/` in that it rounds up instead
   * of rounding down.
   */
  function ceilDiv(uint256 a, uint256 b) internal pure returns (uint256) {
    // (a + b - 1) / b can overflow on addition, so we distribute.
    return a == 0 ? 0 : (a - 1) / b + 1;
  }

  /**
   * @notice Calculates floor(x * y / denominator) with full precision. Throws if result overflows a uint256 or denominator == 0
   * @dev Original credit to Remco Bloemen under MIT license (https://xn--2-umb.com/21/muldiv)
   * with further edits by Uniswap Labs also under MIT license.
   */
  function mulDiv(uint256 x, uint256 y, uint256 denominator) internal pure returns (uint256 result) {
    unchecked {
      // 512-bit multiply [prod1 prod0] = x * y. Compute the product mod 2^256 and mod 2^256 - 1, then use
      // use the Chinese Remainder Theorem to reconstruct the 512 bit result. The result is stored in two 256
      // variables such that product = prod1 * 2^256 + prod0.
      uint256 prod0; // Least significant 256 bits of the product
      uint256 prod1; // Most significant 256 bits of the product
      assembly {
        let mm := mulmod(x, y, not(0))
        prod0 := mul(x, y)
        prod1 := sub(sub(mm, prod0), lt(mm, prod0))
      }

      // Handle non-overflow cases, 256 by 256 division.
      if (prod1 == 0) {
        return prod0 / denominator;
      }

      // Make sure the result is less than 2^256. Also prevents denominator == 0.
      require(denominator > prod1);

      ///////////////////////////////////////////////
      // 512 by 256 division.
      ///////////////////////////////////////////////

      // Make division exact by subtracting the remainder from [prod1 prod0].
      uint256 remainder;
      assembly {
        // Compute remainder using mulmod.
        remainder := mulmod(x, y, denominator)

        // Subtract 256 bit number from 512 bit number.
        prod1 := sub(prod1, gt(remainder, prod0))
        prod0 := sub(prod0, remainder)
      }

      // Factor powers of two out of denominator and compute largest power of two divisor of denominator. Always >= 1.
      // See https://cs.stackexchange.com/q/138556/92363.

      // Does not overflow because the denominator cannot be zero at this stage in the function.
      uint256 twos = denominator & (~denominator + 1);
      assembly {
        // Divide denominator by twos.
        denominator := div(denominator, twos)

        // Divide [prod1 prod0] by twos.
        prod0 := div(prod0, twos)

        // Flip twos such that it is 2^256 / twos. If twos is zero, then it becomes one.
        twos := add(div(sub(0, twos), twos), 1)
      }

      // Shift in bits from prod1 into prod0.
      prod0 |= prod1 * twos;

      // Invert denominator mod 2^256. Now that denominator is an odd number, it has an inverse modulo 2^256 such
      // that denominator * inv = 1 mod 2^256. Compute the inverse by starting with a seed that is correct for
      // four bits. That is, denominator * inv = 1 mod 2^4.
      uint256 inverse = (3 * denominator) ^ 2;

      // Use the Newton-Raphson iteration to improve the precision. Thanks to Hensel's lifting lemma, this also works
      // in modular arithmetic, doubling the correct bits in each step.
      inverse *= 2 - denominator * inverse; // inverse mod 2^8
      inverse *= 2 - denominator * inverse; // inverse mod 2^16
      inverse *= 2 - denominator * inverse; // inverse mod 2^32
      inverse *= 2 - denominator * inverse; // inverse mod 2^64
      inverse *= 2 - denominator * inverse; // inverse mod 2^128
      inverse *= 2 - denominator * inverse; // inverse mod 2^256

      // Because the division is now exact we can divide by multiplying with the modular inverse of denominator.
      // This will give us the correct result modulo 2^256. Since the preconditions guarantee that the outcome is
      // less than 2^256, this is the final result. We don't need to compute the high bits of the result and prod1
      // is no longer required.
      result = prod0 * inverse;
      return result;
    }
  }

  /**
   * @notice Calculates x * y / denominator with full precision, following the selected rounding direction.
   */
  function mulDiv(uint256 x, uint256 y, uint256 denominator, Rounding rounding) internal pure returns (uint256) {
    uint256 result = mulDiv(x, y, denominator);
    if (rounding == Rounding.Up && mulmod(x, y, denominator) > 0) {
      result += 1;
    }
    return result;
  }

  /**
   * @dev Returns the square root of a number. If the number is not a perfect square, the value is rounded down.
   *
   * Inspired by Henry S. Warren, Jr.'s "Hacker's Delight" (Chapter 11).
   */
  function sqrt(uint256 a) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }

    // For our first guess, we get the biggest power of 2 which is smaller than the square root of the target.
    //
    // We know that the "msb" (most significant bit) of our target number `a` is a power of 2 such that we have
    // `msb(a) <= a < 2*msb(a)`. This value can be written `msb(a)=2**k` with `k=log2(a)`.
    //
    // This can be rewritten `2**log2(a) <= a < 2**(log2(a) + 1)`
    // → `sqrt(2**k) <= sqrt(a) < sqrt(2**(k+1))`
    // → `2**(k/2) <= sqrt(a) < 2**((k+1)/2) <= 2**(k/2 + 1)`
    //
    // Consequently, `2**(log2(a) / 2)` is a good first approximation of `sqrt(a)` with at least 1 correct bit.
    uint256 result = 1 << (log2(a) >> 1);

    // At this point `result` is an estimation with one bit of precision. We know the true value is a uint128,
    // since it is the square root of a uint256. Newton's method converges quadratically (precision doubles at
    // every iteration). We thus need at most 7 iteration to turn our partial result with one bit of precision
    // into the expected uint128 result.
    unchecked {
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      result = (result + a / result) >> 1;
      return min(result, a / result);
    }
  }

  /**
   * @notice Calculates sqrt(a), following the selected rounding direction.
   */
  function sqrt(uint256 a, Rounding rounding) internal pure returns (uint256) {
    unchecked {
      uint256 result = sqrt(a);
      return result + (rounding == Rounding.Up && result * result < a ? 1 : 0);
    }
  }

  /**
   * @dev Return the log in base 2, rounded down, of a positive value.
   * Returns 0 if given 0.
   */
  function log2(uint256 value) internal pure returns (uint256) {
    uint256 result = 0;
    unchecked {
      if (value >> 128 > 0) {
        value >>= 128;
        result += 128;
      }
      if (value >> 64 > 0) {
        value >>= 64;
        result += 64;
      }
      if (value >> 32 > 0) {
        value >>= 32;
        result += 32;
      }
      if (value >> 16 > 0) {
        value >>= 16;
        result += 16;
      }
      if (value >> 8 > 0) {
        value >>= 8;
        result += 8;
      }
      if (value >> 4 > 0) {
        value >>= 4;
        result += 4;
      }
      if (value >> 2 > 0) {
        value >>= 2;
        result += 2;
      }
      if (value >> 1 > 0) {
        result += 1;
      }
    }
    return result;
  }

  /**
   * @dev Return the log in base 2, following the selected rounding direction, of a positive value.
   * Returns 0 if given 0.
   */
  function log2(uint256 value, Rounding rounding) internal pure returns (uint256) {
    unchecked {
      uint256 result = log2(value);
      return result + (rounding == Rounding.Up && 1 << result < value ? 1 : 0);
    }
  }

  /**
   * @dev Return the log in base 10, rounded down, of a positive value.
   * Returns 0 if given 0.
   */
  function log10(uint256 value) internal pure returns (uint256) {
    uint256 result = 0;
    unchecked {
      if (value >= 10 ** 64) {
        value /= 10 ** 64;
        result += 64;
      }
      if (value >= 10 ** 32) {
        value /= 10 ** 32;
        result += 32;
      }
      if (value >= 10 ** 16) {
        value /= 10 ** 16;
        result += 16;
      }
      if (value >= 10 ** 8) {
        value /= 10 ** 8;
        result += 8;
      }
      if (value >= 10 ** 4) {
        value /= 10 ** 4;
        result += 4;
      }
      if (value >= 10 ** 2) {
        value /= 10 ** 2;
        result += 2;
      }
      if (value >= 10 ** 1) {
        result += 1;
      }
    }
    return result;
  }

  /**
   * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
   * Returns 0 if given 0.
   */
  function log10(uint256 value, Rounding rounding) internal pure returns (uint256) {
    unchecked {
      uint256 result = log10(value);
      return result + (rounding == Rounding.Up && 10 ** result < value ? 1 : 0);
    }
  }

  /**
   * @dev Return the log in base 256, rounded down, of a positive value.
   * Returns 0 if given 0.
   *
   * Adding one to the result gives the number of pairs of hex symbols needed to represent `value` as a hex string.
   */
  function log256(uint256 value) internal pure returns (uint256) {
    uint256 result = 0;
    unchecked {
      if (value >> 128 > 0) {
        value >>= 128;
        result += 16;
      }
      if (value >> 64 > 0) {
        value >>= 64;
        result += 8;
      }
      if (value >> 32 > 0) {
        value >>= 32;
        result += 4;
      }
      if (value >> 16 > 0) {
        value >>= 16;
        result += 2;
      }
      if (value >> 8 > 0) {
        result += 1;
      }
    }
    return result;
  }

  /**
   * @dev Return the log in base 10, following the selected rounding direction, of a positive value.
   * Returns 0 if given 0.
   */
  function log256(uint256 value, Rounding rounding) internal pure returns (uint256) {
    unchecked {
      uint256 result = log256(value);
      return result + (rounding == Rounding.Up && 1 << (result * 8) < value ? 1 : 0);
    }
  }
}

library Strings {
  bytes16 private constant _SYMBOLS = "0123456789abcdef";
  uint8 private constant _ADDRESS_LENGTH = 20;

  /**
   * @dev Converts a `uint256` to its ASCII `string` decimal representation.
   */
  function toString(uint256 value) internal pure returns (string memory) {
    unchecked {
      uint256 length = Math.log10(value) + 1;
      string memory buffer = new string(length);
      uint256 ptr;
      /// @solidity memory-safe-assembly
      assembly {
        ptr := add(buffer, add(32, length))
      }
      while (true) {
        ptr--;
        /// @solidity memory-safe-assembly
        assembly {
          mstore8(ptr, byte(mod(value, 10), _SYMBOLS))
        }
        value /= 10;
        if (value == 0) break;
      }
      return buffer;
    }
  }

  /**
   * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation.
   */
  function toHexString(uint256 value) internal pure returns (string memory) {
    unchecked {
      return toHexString(value, Math.log256(value) + 1);
    }
  }

  /**
   * @dev Converts a `uint256` to its ASCII `string` hexadecimal representation with fixed length.
   */
  function toHexString(uint256 value, uint256 length) internal pure returns (string memory) {
    bytes memory buffer = new bytes(2 * length + 2);
    buffer[0] = "0";
    buffer[1] = "x";
    for (uint256 i = 2 * length + 1; i > 1; --i) {
      buffer[i] = _SYMBOLS[value & 0xf];
      value >>= 4;
    }
    require(value == 0, "Strings: hex length insufficient");
    return string(buffer);
  }

  /**
   * @dev Converts an `address` with fixed length of 20 bytes to its not checksummed ASCII `string` hexadecimal representation.
   */
  function toHexString(address addr) internal pure returns (string memory) {
    return toHexString(uint256(uint160(addr)), _ADDRESS_LENGTH);
  }
}

library Base64 {
  /**
   * @dev Base64 Encoding/Decoding Table
   */
  string internal constant _TABLE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

  /**
   * @dev Converts a `bytes` to its Bytes64 `string` representation.
   */
  function encode(bytes memory data) internal pure returns (string memory) {
    /**
     * Inspired by Brecht Devos (Brechtpd) implementation - MIT licence
     * https://github.com/Brechtpd/base64/blob/e78d9fd951e7b0977ddca77d92dc85183770daf4/base64.sol
     */
    if (data.length == 0) return "";

    // Loads the table into memory
    string memory table = _TABLE;

    // Encoding takes 3 bytes chunks of binary data from `bytes` data parameter
    // and split into 4 numbers of 6 bits.
    // The final Base64 length should be `bytes` data length multiplied by 4/3 rounded up
    // - `data.length + 2`  -> Round up
    // - `/ 3`              -> Number of 3-bytes chunks
    // - `4 *`              -> 4 characters for each chunk
    string memory result = new string(4 * ((data.length + 2) / 3));

    /// @solidity memory-safe-assembly
    assembly {
      // Prepare the lookup table (skip the first "length" byte)
      let tablePtr := add(table, 1)

      // Prepare result pointer, jump over length
      let resultPtr := add(result, 32)

      // Run over the input, 3 bytes at a time
      for {
        let dataPtr := data
        let endPtr := add(data, mload(data))
      } lt(dataPtr, endPtr) {

      } {
        // Advance 3 bytes
        dataPtr := add(dataPtr, 3)
        let input := mload(dataPtr)

        // To write each character, shift the 3 bytes (18 bits) chunk
        // 4 times in blocks of 6 bits for each character (18, 12, 6, 0)
        // and apply logical AND with 0x3F which is the number of
        // the previous character in the ASCII table prior to the Base64 Table
        // The result is then added to the table to get the character to write,
        // and finally write it in the result pointer but with a left shift
        // of 256 (1 byte) - 8 (1 ASCII char) = 248 bits

        mstore8(resultPtr, mload(add(tablePtr, and(shr(18, input), 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance

        mstore8(resultPtr, mload(add(tablePtr, and(shr(12, input), 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance

        mstore8(resultPtr, mload(add(tablePtr, and(shr(6, input), 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance

        mstore8(resultPtr, mload(add(tablePtr, and(input, 0x3F))))
        resultPtr := add(resultPtr, 1) // Advance
      }

      // When data `bytes` is not exactly 3 bytes long
      // it is padded with `=` characters at the end
      switch mod(mload(data), 3)
      case 1 {
        mstore8(sub(resultPtr, 1), 0x3d)
        mstore8(sub(resultPtr, 2), 0x3d)
      }
      case 2 {
        mstore8(sub(resultPtr, 1), 0x3d)
      }
    }

    return result;
  }
}

/// NFT metadata library for rendering metadata associated with editions
library NFTMetadataRenderer {
  /// Function to create the metadata for an edition
  /// @param params MetadataParams struct containing all metadata information
  function createMetadataEdition(MetadataParams memory params) internal pure returns (string memory) {
    string memory _tokenMediaData = tokenMediaData(
      params.imageURI,
      params.animationURI,
      params.externalUrl,
      params.encryptedMediaUrl,
      params.decryptionKey,
      params.hash,
      params.decryptedMediaUrl
    );
    bytes memory json = createMetadataJSON(
      params.name,
      params.description,
      _tokenMediaData,
      params.tokenOfEdition,
      params.editionSize,
      params.externalUrl,
      params.imageURI,
      params.encryptedMediaUrl,
      params.decryptionKey,
      params.hash,
      params.decryptedMediaUrl,
      params.animationURI
    );
    return encodeMetadataJSON(json);
  }

  function encodeContractURIJSON(
    string memory name,
    string memory description,
    string memory imageURI,
    string memory animationURI,
    uint256 royaltyBPS,
    address royaltyRecipient
  ) internal pure returns (string memory) {
    bytes memory imageSpace = bytes("");
    if (bytes(imageURI).length > 0) {
      imageSpace = abi.encodePacked('", "image": "', imageURI);
    }
    bytes memory animationSpace = bytes("");
    if (bytes(animationURI).length > 0) {
      animationSpace = abi.encodePacked('", "animation_url": "', animationURI);
    }

    return
      string(
        encodeMetadataJSON(
          abi.encodePacked(
            '{"name": "',
            name,
            '", "description": "',
            description,
            // this is for opensea since they don't respect ERC2981 right now
            '", "seller_fee_basis_points": ',
            Strings.toString(royaltyBPS),
            ', "fee_recipient": "',
            Strings.toHexString(uint256(uint160(royaltyRecipient)), 20),
            imageSpace,
            animationSpace,
            '"}'
          )
        )
      );
  }

  /// Function to create the metadata json string for the nft edition
  /// @param name Name of NFT in metadata
  /// @param description Description of NFT in metadata
  /// @param mediaData Data for media to include in json object
  /// @param tokenOfEdition Token ID for specific token
  /// @param editionSize Size of entire edition to show
  /// @param externalUrl URL related to the NFT
  /// @param imageUrl URL for the main image of the NFT
  /// @param encryptedMediaUrl URL for encrypted media
  /// @param decryptionKey Key used for decryption
  /// @param hash Unique hash for the NFT
  /// @param decryptedMediaUrl URL for decrypted media
  /// @param animationUrl URL for animation media
  function createMetadataJSON(
    string memory name,
    string memory description,
    string memory mediaData,
    uint256 tokenOfEdition,
    uint256 editionSize,
    string memory externalUrl,
    string memory imageUrl,
    string memory encryptedMediaUrl,
    string memory decryptionKey,
    string memory hash,
    string memory decryptedMediaUrl,
    string memory animationUrl
  ) internal pure returns (bytes memory) {
    bytes memory editionSizeText;
    if (editionSize > 0) {
      editionSizeText = abi.encodePacked("/", Strings.toString(editionSize));
    }
    return
      abi.encodePacked(
        '{"name": "',
        name,
        " ",
        Strings.toString(tokenOfEdition),
        editionSizeText,
        '", "description": "',
        description,
        '", "external_url": "',
        externalUrl,
        '", "image": "',
        imageUrl,
        '", "encrypted_media_url": "',
        encryptedMediaUrl,
        '", "decryption_key": "',
        decryptionKey,
        '", "hash": "',
        hash,
        '", "decrypted_media_url": "',
        decryptedMediaUrl,
        '", "animation_url": "',
        animationUrl,
        '", "properties": {"number": ',
        Strings.toString(tokenOfEdition),
        ', "name": "',
        name,
        '"}}'
      );
  }

  /// Encodes the argument json bytes into base64-data uri format
  /// @param json Raw json to base64 and turn into a data-uri
  function encodeMetadataJSON(bytes memory json) internal pure returns (string memory) {
    return string(abi.encodePacked("data:application/json;base64,", Base64.encode(json)));
  }

  /// Generates edition metadata from storage information as base64-json blob
  /// Combines the media data and metadata
  /// @param imageUrl URL of image to render for edition
  /// @param animationUrl URL of animation to render for edition
  function tokenMediaData(string memory imageUrl, string memory animationUrl) internal pure returns (string memory) {
    bool hasImage = bytes(imageUrl).length > 0;
    bool hasAnimation = bytes(animationUrl).length > 0;
    if (hasImage && hasAnimation) {
      return string(abi.encodePacked('image": "', imageUrl, '", "animation_url": "', animationUrl, '", "'));
    }
    if (hasImage) {
      return string(abi.encodePacked('image": "', imageUrl, '", "'));
    }
    if (hasAnimation) {
      return string(abi.encodePacked('animation_url": "', animationUrl, '", "'));
    }

    return "";
  }

  /// @dev Generates a metadata string from provided URLs and keys
  /// This function checks for the presence of media-related information and formats them into a JSON-like string.
  /// @param imageUrl URL of the image associated with the NFT
  /// @param animationUrl URL of the animation associated with the NFT
  /// @param externalUrl URL of an external website providing more details about the NFT
  /// @param encryptedMediaUrl URL of the encrypted media
  /// @param decryptionKey Key required to decrypt the encrypted media
  /// @param hash Hash of the encrypted file to ensure integrity
  /// @param decryptedMediaUrl URL where the decrypted media can be accessed
  /// @return A string that concatenates all provided and non-empty fields into a JSON-like format for NFT metadata.
  function tokenMediaData(
    string memory imageUrl,
    string memory animationUrl,
    string memory externalUrl,
    string memory encryptedMediaUrl,
    string memory decryptionKey,
    string memory hash,
    string memory decryptedMediaUrl
  ) internal pure returns (string memory) {
    // Initialize boolean variables to check if each parameter contains data.
    bool hasImage = bytes(imageUrl).length > 0;
    bool hasAnimation = bytes(animationUrl).length > 0;
    bool hasExternal = bytes(externalUrl).length > 0;
    bool hasEncryptedMedia = bytes(encryptedMediaUrl).length > 0;
    bool hasDecryptionKey = bytes(decryptionKey).length > 0;
    bool hasHash = bytes(hash).length > 0;
    bool hasDecryptedMedia = bytes(decryptedMediaUrl).length > 0;

    // Check if all parameters are provided and concatenate them into a JSON-like string.
    if (
      hasImage && hasAnimation && hasExternal && hasEncryptedMedia && hasDecryptionKey && hasHash && hasDecryptedMedia
    ) {
      return
        string(
          abi.encodePacked(
            '"image": "',
            imageUrl,
            '", ',
            '"animation_url": "',
            animationUrl,
            '", ',
            '"external_url": "',
            externalUrl,
            '", ',
            '"encrypted_media_url": "',
            encryptedMediaUrl,
            '", ',
            '"decryption_key": "',
            decryptionKey,
            '", ',
            '"hash": "',
            hash,
            '", ',
            '"decrypted_media_url": "',
            decryptedMediaUrl,
            '", '
          )
        );
    }

    // Individual checks for each field, appending them to the result if they contain data.
    if (hasImage) {
      return string(abi.encodePacked('"image": "', imageUrl, '", '));
    }
    if (hasAnimation) {
      return string(abi.encodePacked('"animation_url": "', animationUrl, '", '));
    }
    if (hasExternal) {
      return string(abi.encodePacked('"external_url": "', externalUrl, '", '));
    }
    if (hasEncryptedMedia) {
      return string(abi.encodePacked('"encrypted_media_url": "', encryptedMediaUrl, '", '));
    }
    if (hasDecryptionKey) {
      return string(abi.encodePacked('"decryption_key": "', decryptionKey, '", '));
    }
    if (hasHash) {
      return string(abi.encodePacked('"hash": "', hash, '", '));
    }
    if (hasDecryptedMedia) {
      return string(abi.encodePacked('"decrypted_media_url": "', decryptedMediaUrl, '", '));
    }

    // Return an empty string if none of the fields are provided.
    return "";
  }
}
