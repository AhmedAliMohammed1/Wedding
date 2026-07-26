import { motion } from 'framer-motion';
import { Volume2 } from 'lucide-react';
import type { InvitationConfig } from '../../types/invitation';
import { DecorativeFrame } from '../decorations/DecorativeFrame';
import { FloatingPetals } from '../decorations/FloatingPetals';
import { Monogram } from '../decorations/Monogram';

interface Props {
  invitation: InvitationConfig;
  onOpen: () => void;
}

export function InvitationEntrance({ invitation, onOpen }: Props) {
  return (
    <motion.div
      className="entrance"
      role="dialog"
      aria-modal="true"
      aria-labelledby="entrance-title"
      exit={{ opacity: 0, scale: 1.025 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="entrance-backdrop" />
      <FloatingPetals count={8} />
      <DecorativeFrame />
      <motion.div
        className="entrance-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 1.1 }}
      >
        <p className="eyebrow">{invitation.openingMessage}</p>
        <Monogram initials={invitation.initials} size="large" light />
        <p className="entrance-names" id="entrance-title">
          {invitation.brideName} <span>&</span> {invitation.groomName}
        </p>
        <p className="entrance-date">{invitation.shortDate}</p>
        <button className="open-button" type="button" onClick={onOpen}>
          <span>Tap to open</span>
          <Volume2 size={16} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <p className="sound-note">Sound begins after opening</p>
      </motion.div>
    </motion.div>
  );
}
