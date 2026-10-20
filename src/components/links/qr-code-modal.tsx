import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link as LinkType } from '@/types/database';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: LinkType | null;
}

export function QrCodeModal({ isOpen, onClose, link }: QrCodeModalProps) {
  const [pngDataUrl, setPngDataUrl] = useState<string>('');
  const [svgString, setSvgString] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [qrColor, setQrColor] = useState('#14181F');
  const [error, setError] = useState<string | null>(null);

  const shortUrl = link ? `${window.location.origin}/r/${link.code}?s=qr` : '';

  useEffect(() => {
    if (link && isOpen) {
      let cancelled = false;
      setPngDataUrl('');
      setSvgString('');
      setError(null);
      Promise.all([
        QRCode.toDataURL(shortUrl, {
          width: 400,
          margin: 2,
          color: { dark: qrColor, light: '#FFFFFF' },
        }),
        QRCode.toString(shortUrl, {
          type: 'svg',
          margin: 2,
          color: { dark: qrColor, light: '#FFFFFF' },
        }),
      ]).then(([png, svg]) => {
        if (!cancelled) {
          setPngDataUrl(png);
          setSvgString(svg);
        }
      }).catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to generate this QR code.');
        }
      });
      return () => { cancelled = true; };
    }
  }, [link, isOpen, shortUrl, qrColor]);

  if (!isOpen || !link) return null;

  const handleDownloadPng = () => {
    const a = document.createElement('a');
    a.href = pngDataUrl;
    a.download = `qr-${link.code}.png`;
    a.click();
  };

  const handleDownloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${link.code}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyShortUrl = async () => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      setCopied(true);
      setError(null);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to copy the QR target URL.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-modal dark:border-border-dark dark:bg-surface-dark flex flex-col items-center text-center">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-muted hover:bg-canvas hover:text-ink dark:text-muted-dark dark:hover:bg-canvas-dark dark:hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-heading text-lg font-bold text-ink dark:text-white">
          {link.title}
        </h3>
        <p className="mt-1 font-mono text-xs text-brand font-medium">
          /r/{link.code}
        </p>

        {/* QR Code Canvas */}
        <div className="mt-4 flex h-60 w-60 items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-subtle dark:border-border-dark dark:bg-white">
          {pngDataUrl ? (
            <img src={pngDataUrl} alt="QR Code" className="h-full w-full object-contain" />
          ) : (
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          )}
        </div>
        {error && <p role="alert" className="mt-2 text-xs text-danger">{error}</p>}

        {/* Color Palette Selector */}
        <div className="mt-4 flex items-center gap-2">
          <span className="text-[11px] text-muted">Color:</span>
          {['#14181F', '#0AA5E8', '#12A150', '#FF7A1A'].map((col) => (
            <button
              key={col}
              onClick={() => setQrColor(col)}
              className={`h-5 w-5 rounded-full border border-white shadow-sm transition-transform ${
                qrColor === col ? 'scale-125 ring-2 ring-brand ring-offset-1' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: col }}
            />
          ))}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Badge variant="brand" className="text-[10px] font-mono">
            Scan attribution: ?s=qr
          </Badge>
        </div>

        {/* Copy & Downloads */}
        <div className="mt-6 flex w-full flex-col gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCopyShortUrl}
            className="w-full gap-2 justify-center font-mono text-xs"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied QR Target URL!' : shortUrl}</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadPng}
              disabled={!pngDataUrl}
              className="flex-1 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download PNG</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSvg}
              disabled={!svgString}
              className="flex-1 gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-muted" />
              <span>Download SVG</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
