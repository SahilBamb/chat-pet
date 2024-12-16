import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const DIRS_TO_OPTIMIZE = [
  'public/assets/pet',
  'public/assets/ai',
  'public/assets'
];

async function optimizeImage(inputPath) {
  const info = await sharp(inputPath).metadata();
  
  // If image is larger than 800px in either dimension, resize it
  const needsResize = info.width > 800 || info.height > 800;
  
  let pipeline = sharp(inputPath);
  
  if (needsResize) {
    pipeline = pipeline.resize(800, 800, {
      fit: 'inside',
      withoutEnlargement: true
    });
  }

  // For PNGs, reduce colors and compress
  if (path.extname(inputPath) === '.png') {
    pipeline = pipeline
      .png({
        quality: 80,
        colors: 256,
        compressionLevel: 9
      });
  }
  
  // For JPGs, optimize quality
  if (path.extname(inputPath) === '.jpg') {
    pipeline = pipeline
      .jpeg({
        quality: 80,
        progressive: true
      });
  }

  const outputPath = inputPath.replace(/\.(png|jpg)$/, '.optimized.$1');
  await pipeline.toFile(outputPath);
  
  // Replace original with optimized version
  fs.renameSync(outputPath, inputPath);
}

async function optimizeDir(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (file.match(/\.(png|jpg)$/i)) {
      console.log(`Optimizing ${filePath}...`);
      await optimizeImage(filePath);
    }
  }
}

// Run optimization
for (const dir of DIRS_TO_OPTIMIZE) {
  await optimizeDir(dir);
} 