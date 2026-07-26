interface Props {
  initials: string;
  size?: 'small' | 'medium' | 'large';
  light?: boolean;
}

export function Monogram({ initials, size = 'medium', light = false }: Props) {
  return (
    <div className={`monogram monogram-${size} ${light ? 'monogram-light' : ''}`} aria-label={`${initials} monogram`}>
      <span>{initials}</span>
    </div>
  );
}
