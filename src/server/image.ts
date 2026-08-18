export type SupportedImageMime = 'image/jpeg' | 'image/png' | 'image/webp';

export function readImageDimensions(bytes: Buffer, mimeType: SupportedImageMime) {
  if (mimeType === 'image/png') {
    const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (bytes.length < 24 || !bytes.subarray(0, 8).equals(png)) throw new Error('INVALID_PNG');
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (mimeType === 'image/jpeg') {
    if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error('INVALID_JPEG');
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = bytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const length = bytes.readUInt16BE(offset + 2);
      if (length < 2 || offset + 2 + length > bytes.length) throw new Error('INVALID_JPEG');
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker))
        return {
          width: bytes.readUInt16BE(offset + 7),
          height: bytes.readUInt16BE(offset + 5),
        };
      offset += 2 + length;
    }
    throw new Error('JPEG_DIMENSIONS_NOT_FOUND');
  }
  if (bytes.length < 30 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP')
    throw new Error('INVALID_WEBP');
  const format = bytes.toString('ascii', 12, 16);
  if (format === 'VP8X')
    return {
      width: 1 + bytes.readUIntLE(24, 3),
      height: 1 + bytes.readUIntLE(27, 3),
    };
  if (format === 'VP8 ' && bytes.length >= 30)
    return {
      width: bytes.readUInt16LE(26) & 0x3fff,
      height: bytes.readUInt16LE(28) & 0x3fff,
    };
  if (format === 'VP8L' && bytes.length >= 25) {
    const packed = bytes.readUInt32LE(21);
    return {
      width: 1 + (packed & 0x3fff),
      height: 1 + ((packed >> 14) & 0x3fff),
    };
  }
  throw new Error('WEBP_DIMENSIONS_NOT_FOUND');
}
