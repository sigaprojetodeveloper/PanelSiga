import React, { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropperModalProps {
  file: File;
  aspectRatio?: '9:16' | '1:1' | '16:9';
  onCrop: (croppedFile: File) => void;
  onClose: () => void;
}

export default function ImageCropperModal({ file, aspectRatio = '9:16', onCrop, onClose }: ImageCropperModalProps) {
  const [imageSrc, setImageSrc] = useState<string>('');
  const [baseSize, setBaseSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [processing, setProcessing] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });

  let VIEWPORT_WIDTH = 270;
  let VIEWPORT_HEIGHT = 480;
  let canvasWidth = 1080;
  let canvasHeight = 1920;

  if (aspectRatio === '1:1') {
    VIEWPORT_WIDTH = 300;
    VIEWPORT_HEIGHT = 300;
    canvasWidth = 1080;
    canvasHeight = 1080;
  } else if (aspectRatio === '16:9') {
    VIEWPORT_WIDTH = 400;
    VIEWPORT_HEIGHT = 225;
    canvasWidth = 1920;
    canvasHeight = 1080;
  }

  // Load the file as an object URL
  useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setImageSrc(objectUrl);
    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    // Calculate scale to cover viewport (object-fit: cover equivalent)
    const smin = Math.max(VIEWPORT_WIDTH / img.naturalWidth, VIEWPORT_HEIGHT / img.naturalHeight);
    const w = img.naturalWidth * smin;
    const h = img.naturalHeight * smin;
    setBaseSize({ width: w, height: h });
    // Center the image initially
    setPosition({
      x: (VIEWPORT_WIDTH - w) / 2,
      y: (VIEWPORT_HEIGHT - h) / 2,
    });
  };

  const clamp = (val: number, min: number, max: number) => {
    if (min > max) return 0;
    return Math.min(Math.max(val, min), max);
  };

  // Adjust position constraints when zoom changes
  useEffect(() => {
    if (baseSize.width === 0) return;
    const rw = baseSize.width * zoom;
    const rh = baseSize.height * zoom;
    setPosition((prev) => ({
      x: clamp(prev.x, VIEWPORT_WIDTH - rw, 0),
      y: clamp(prev.y, VIEWPORT_HEIGHT - rh, 0),
    }));
  }, [zoom, baseSize, VIEWPORT_WIDTH, VIEWPORT_HEIGHT]);

  // Global mouse up/touch end to stop dragging
  useEffect(() => {
    const handleGlobalEnd = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleGlobalEnd);
    window.addEventListener('touchend', handleGlobalEnd);
    return () => {
      window.removeEventListener('mouseup', handleGlobalEnd);
      window.removeEventListener('touchend', handleGlobalEnd);
    };
  }, []);

  const handleStart = (clientX: number, clientY: number) => {
    isDragging.current = true;
    startPos.current = { x: clientX, y: clientY };
    currentOffset.current = { ...position };
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging.current) return;
    const dx = clientX - startPos.current.x;
    const dy = clientY - startPos.current.y;
    const rw = baseSize.width * zoom;
    const rh = baseSize.height * zoom;

    setPosition({
      x: clamp(currentOffset.current.x + dx, VIEWPORT_WIDTH - rw, 0),
      y: clamp(currentOffset.current.y + dy, VIEWPORT_HEIGHT - rh, 0),
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleMove(e.clientX, e.clientY);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches[0]) {
      handleStart(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

const reduceQuality = async (
  canvas: HTMLCanvasElement,
  targetSize: number
): Promise<Blob | null> => {
  let quality = 0.9;
  let blob: Blob | null = null;
  const getBlob = (q: number): Promise<Blob | null> => {
    return new Promise((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/jpeg', q);
    });
  };

  blob = await getBlob(quality);
  while (blob && blob.size > targetSize && quality > 0.3) {
    quality -= 0.1;
    blob = await getBlob(quality);
  }
  return blob;
};

const scaleResolution = async (
  canvas: HTMLCanvasElement,
  targetSize: number
): Promise<Blob | null> => {
  let blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.6);
  });
  if (!blob || blob.size <= targetSize) return blob;

  let scaleDown = 0.8;
  while (blob && blob.size > targetSize && scaleDown > 0.2) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.round(canvas.width * scaleDown);
    tempCanvas.height = Math.round(canvas.height * scaleDown);
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);
      blob = await new Promise<Blob | null>((resolve) => {
        tempCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.6);
      });
    }
    scaleDown -= 0.1;
  }
  return blob;
};

const compressImageToBlob = async (
  canvas: HTMLCanvasElement,
  targetSize: number = 1024 * 1024
): Promise<Blob | null> => {
  let blob = await reduceQuality(canvas, targetSize);
  if (blob && blob.size > targetSize) {
    blob = await scaleResolution(canvas, targetSize);
  }
  return blob;
};

interface CropCoords {
  sourceX: number;
  sourceY: number;
  sourceWidth: number;
  sourceHeight: number;
}

function limitCoord(val: number, maxVal: number): number {
  if (!isFinite(val)) return 0;
  return Math.max(0, Math.min(val, maxVal - 1));
}

function limitDim(val: number, maxVal: number, offset: number): number {
  if (!isFinite(val) || val <= 0) return maxVal - offset;
  return Math.min(val, maxVal - offset);
}

const getCropCoords = (
  naturalWidth: number,
  naturalHeight: number,
  zoom: number,
  positionX: number,
  positionY: number,
  viewportWidth: number,
  viewportHeight: number
): CropCoords => {
  const safeWidth = naturalWidth || 1;
  const safeHeight = naturalHeight || 1;
  const safeZoom = zoom || 1;

  const smin = Math.max(viewportWidth / safeWidth, viewportHeight / safeHeight);
  const scale = (smin * safeZoom) || 1;

  const sourceX = limitCoord(-positionX / scale, safeWidth);
  const sourceY = limitCoord(-positionY / scale, safeHeight);
  const sourceWidth = limitDim(viewportWidth / scale, safeWidth, sourceX);
  const sourceHeight = limitDim(viewportHeight / scale, safeHeight, sourceY);

  return {
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
  };
};

  const handleCropSave = async () => {
    if (!imgRef.current || processing) return;
    setProcessing(true);

    try {
      const img = imgRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      const { sourceX, sourceY, sourceWidth, sourceHeight } = getCropCoords(
        img.naturalWidth,
        img.naturalHeight,
        zoom,
        position.x,
        position.y,
        VIEWPORT_WIDTH,
        VIEWPORT_HEIGHT
      );

      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob = await compressImageToBlob(canvas);
      if (!blob) throw new Error('Failed to generate image blob');

      // Create new File object under 1MB
      const nameWithoutExt = file.name ? file.name.replace(/\.[^/.]+$/, '') : 'image';
      const croppedFile = new File([blob], `${nameWithoutExt}_cropped.jpg`, {
        type: 'image/jpeg',
      });

      onCrop(croppedFile);
    } catch (error) {
      console.error('Error cropping image:', error);
      alert(`Ocorreu um erro ao processar e cortar a imagem: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={(e) => e.stopPropagation()}>
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <button className="modal-close" onClick={onClose} disabled={processing}>
          <X size={20} />
        </button>

        <h3 className="modal-title" style={{ width: '100%', textAlign: 'center', margin: 0 }}>
          Recortar Imagem (Proporção {aspectRatio})
        </h3>
        
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '-8px' }}>
          Arraste a imagem para mover e use a barra de zoom para ajustar. O arquivo final será reduzido para menos de 1MB.
        </p>

        {/* Viewport container */}
        <div
          style={{
            width: `${VIEWPORT_WIDTH}px`,
            height: `${VIEWPORT_HEIGHT}px`,
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#111',
            borderRadius: 'var(--radius-md)',
            border: '2px solid var(--primary)',
            boxShadow: 'var(--shadow-lg)',
            cursor: 'move',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
        >
          {imageSrc && (
            <img
              ref={imgRef}
              src={imageSrc}
              alt="Crop Source"
              onLoad={handleImageLoad}
              draggable={false}
              style={{
                position: 'absolute',
                left: `${position.x}px`,
                top: `${position.y}px`,
                width: `${baseSize.width * zoom}px`,
                height: `${baseSize.height * zoom}px`,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                pointerEvents: 'none',
                maxWidth: 'none',
                maxHeight: 'none',
              }}
            />
          )}
        </div>

        {/* Zoom controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            width: '100%',
            justifyContent: 'center',
            marginTop: '8px',
          }}
        >
          <ZoomOut size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            style={{
              flex: 1,
              maxWidth: '200px',
              accentColor: 'var(--primary)',
              cursor: 'pointer',
            }}
          />
          <ZoomIn size={16} style={{ color: 'var(--text-muted)' }} />
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setZoom(1)}
            style={{ marginLeft: '12px' }}
          >
            Resetar Zoom
          </button>
        </div>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            width: '100%',
            justifyContent: 'flex-end',
            marginTop: '16px',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '16px',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={processing}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCropSave}
            disabled={processing || baseSize.width === 0}
          >
            {processing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid var(--text-white)',
                    borderTopColor: 'transparent',
                    animation: 'spin 1s linear infinite',
                  }}
                />
                Processando...
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} /> Aplicar e Salvar
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
