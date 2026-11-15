/**
 * getCroppedImg
 * Takes an image source URL and a pixelCrop object from react-easy-crop,
 * renders the cropped region onto a canvas, and returns a base64 JPEG string.
 *
 * @param {string} imageSrc  – ObjectURL or base64 data URL of the source image
 * @param {object} pixelCrop – { x, y, width, height } from react-easy-crop's onCropComplete
 * @param {number} outputSize – size (px) of the square output canvas (default 400)
 * @returns {Promise<string>} base64 data URL (image/jpeg)
 */
export const getCroppedImg = (imageSrc, pixelCrop, outputSize = 400) => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas");
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        outputSize,
        outputSize
      );

      resolve(canvas.toDataURL("image/jpeg", 0.9));
    });
    image.addEventListener("error", reject);
    image.src = imageSrc;
  });
};
