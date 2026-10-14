import { cva } from 'class-variance-authority';
import { cn } from 'drupal-canvas';

const buttonVariants = cva(
  'inline-flex items-center gap-3 rounded-full px-6 py-2.5 text-sm font-semibold',
  {
    variants: {
      variant: {
        blue: 'bg-[#02355A] text-[#A8C0FC] hover:bg-[#012844]',
        light: 'bg-[#A8C0FC] text-[#02355A] hover:bg-[#95B2F8]',
      },
    },
    defaultVariants: {
      variant: 'blue',
    },
  },
);

const PepsicoButton = ({ text = '', link = '', variant = 'blue' }) => {
  const className = cn(buttonVariants({ variant }));
  const content = (
    <>
      {text}
      <span aria-hidden="true">→</span>
    </>
  );

  if (!link) {
    return <span className={className}>{content}</span>;
  }

  return (
    <a href={link} className={className}>
      {content}
    </a>
  );
};

export default PepsicoButton;
