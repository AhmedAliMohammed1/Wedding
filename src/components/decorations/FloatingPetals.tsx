export function FloatingPetals({ count = 9 }: { count?: number }) {
  return (
    <div className="floating-petals" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => (
        <i key={index} style={{ '--petal-index': index } as React.CSSProperties} />
      ))}
    </div>
  );
}
