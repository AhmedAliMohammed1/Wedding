import { FloralDivider } from '../decorations/FloralDivider';

interface Props {
  id?: string;
  eyebrow: string;
  title: string;
  description?: string;
  light?: boolean;
}

export function SectionHeading({ id, eyebrow, title, description, light = false }: Props) {
  return (
    <header className={`section-heading ${light ? 'section-heading-light' : ''}`} data-reveal>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id}>{title}</h2>
      {description ? <p className="section-intro">{description}</p> : null}
      <FloralDivider />
    </header>
  );
}
