import { useState } from 'react';
import { ChevronLeft, ChevronRight, Expand, X } from 'lucide-react';
import { A11y, Keyboard, Navigation, Pagination } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import type { GalleryItem } from '../../types/invitation';
import { ImageWithFallback } from '../common/ImageWithFallback';
import { SectionHeading } from '../common/SectionHeading';

export function PhotoGallery({ gallery }: { gallery: GalleryItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const active = gallery[activeIndex];

  if (gallery.length === 0) {
    return (
      <section className="gallery-section section-shell" id="gallery" aria-labelledby="gallery-heading">
        <SectionHeading id="gallery-heading" eyebrow="Captured moments" title="The gallery is growing" />
        <p className="empty-state">Photographs will be added soon.</p>
      </section>
    );
  }

  return (
    <section className="gallery-section section-shell" id="gallery" aria-labelledby="gallery-heading">
      <SectionHeading
        id="gallery-heading"
        eyebrow="Captured moments"
        title="Fragments of our world"
        description="A collection of colours, places, and details that feel like us."
      />
      <div className="gallery-wrap" data-reveal>
        <Swiper
          modules={[A11y, Keyboard, Navigation, Pagination]}
          slidesPerView={1.12}
          spaceBetween={18}
          centeredSlides
          loop={gallery.length > 2}
          speed={720}
          keyboard={{ enabled: true }}
          navigation={{ prevEl: '.gallery-prev', nextEl: '.gallery-next' }}
          pagination={{ clickable: true }}
          a11y={{ enabled: true }}
          breakpoints={{
            640: { slidesPerView: 1.65, spaceBetween: 24 },
            900: { slidesPerView: 2.35, spaceBetween: 30 }
          }}
          onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
        >
          {gallery.map((image, index) => (
            <SwiperSlide key={image.src}>
              <figure className="gallery-card">
                <ImageWithFallback
                  src={image.src}
                  alt={image.alt}
                  width={image.width}
                  height={image.height}
                  loading={index === 0 ? 'eager' : 'lazy'}
                />
                <figcaption>{image.caption}</figcaption>
                <button
                  type="button"
                  className="lightbox-trigger"
                  aria-label={`Open ${image.caption} in a larger view`}
                  onClick={() => {
                    setActiveIndex(index);
                    setLightboxOpen(true);
                  }}
                >
                  <Expand size={17} aria-hidden="true" />
                </button>
              </figure>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="gallery-controls" aria-label="Gallery navigation">
          <button className="gallery-prev" type="button" aria-label="Previous photograph">
            <ChevronLeft aria-hidden="true" />
          </button>
          <p aria-live="polite">
            <span>{String(activeIndex + 1).padStart(2, '0')}</span> / {String(gallery.length).padStart(2, '0')}
          </p>
          <button className="gallery-next" type="button" aria-label="Next photograph">
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
      {lightboxOpen && active ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setLightboxOpen(false);
          }}
        >
          <button type="button" aria-label="Close larger image" onClick={() => setLightboxOpen(false)}>
            <X aria-hidden="true" />
          </button>
          <figure>
            <ImageWithFallback src={active.src} alt={active.alt} width={active.width} height={active.height} />
            <figcaption>{active.caption}</figcaption>
          </figure>
        </div>
      ) : null}
    </section>
  );
}
