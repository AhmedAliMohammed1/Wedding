interface Props {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  muted?: boolean;
}

export function BotanicalCorner({ position = 'top-left', muted = false }: Props) {
  return (
    <div className={`botanical-corner ${position} ${muted ? 'muted' : ''}`} aria-hidden="true">
      <span className="branch" />
      <i className="leaf leaf-one" />
      <i className="leaf leaf-two" />
      <i className="leaf leaf-three" />
      <i className="leaf leaf-four" />
    </div>
  );
}
