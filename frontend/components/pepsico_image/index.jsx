import { Image as ResponsiveImage, cn } from 'drupal-canvas';

const sizeClass = {
  logo: 'h-10 w-auto max-w-40',
  small: 'w-40 max-w-full',
  medium: 'w-full max-w-md',
  large: 'w-full max-w-4xl',
  full: 'w-full',
};

const sizeHint = {
  logo: '160px',
  small: '160px',
  medium: '28rem',
  large: '56rem',
  full: '100vw',
};

const alignClass = {
  start: 'mr-auto',
  center: 'mx-auto',
  end: 'ml-auto',
};

const PepsicoImage = ({
  image,
  size = 'logo',
  fit = 'contain',
  align = 'start',
  link = '',
}) => {
  if (!image?.src) {
    return null;
  }

  const { src, alt, width, height } = image;
  const href = typeof link === 'string' ? link.trim() : '';
  const picture = (
    <ResponsiveImage
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizeHint[size] ?? sizeHint.logo}
      className={cn(
        'block h-auto max-w-full',
        sizeClass[size] ?? sizeClass.logo,
        href ? null : (alignClass[align] ?? alignClass.start),
        fit === 'cover' ? 'object-cover' : 'object-contain',
      )}
      style={{ width: size === 'logo' ? 'auto' : '100%', height: 'auto' }}
    />
  );

  if (!href) {
    return picture;
  }

  return (
    <a
      href={href}
      className={cn('inline-block', alignClass[align] ?? alignClass.start)}
    >
      {picture}
    </a>
  );
};

export default PepsicoImage;
