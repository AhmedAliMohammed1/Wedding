import { BotanicalCorner } from './BotanicalCorner';

export function DecorativeFrame() {
  return (
    <div className="decorative-frame" aria-hidden="true">
      <BotanicalCorner position="top-left" />
      <BotanicalCorner position="top-right" />
      <BotanicalCorner position="bottom-left" />
      <BotanicalCorner position="bottom-right" />
    </div>
  );
}
