import { motion } from 'framer-motion';
import { BotanicalCorner } from '../decorations/BotanicalCorner';
import { Monogram } from '../decorations/Monogram';

interface Props {
  initials: string;
}

export function LoadingScreen({ initials }: Props) {
  return (
    <motion.div
      className="loading-screen"
      role="status"
      aria-label="Preparing the invitation"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <BotanicalCorner position="top-left" muted />
      <BotanicalCorner position="bottom-right" muted />
      <Monogram initials={initials} />
      <div className="loading-leaves" aria-hidden="true">
        <i />
        <i />
        <i />
      </div>
      <p>Preparing the garden</p>
      <span className="loading-line" />
    </motion.div>
  );
}
