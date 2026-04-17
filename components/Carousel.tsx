import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: string[];
  className?: string;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  showArrows?: boolean;
}

export const Carousel: React.FC<CarouselProps> = ({ images, className = "", currentIndex, setCurrentIndex, showArrows = false }) => {
  if (!images || images.length === 0) return null;

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className={`relative w-full aspect-video overflow-hidden rounded-xl ${className}`}>
      <AnimatePresence mode="wait">
        <motion.img
          key={currentIndex}
          src={images[currentIndex]}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 1 }}
          transition={{ duration: 0 }}
          className="w-full h-full object-cover"
          alt={`Banner ${currentIndex + 1}`}
          referrerPolicy="no-referrer"
        />
      </AnimatePresence>
      {showArrows && images.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
            <ChevronLeft size={24} />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70">
            <ChevronRight size={24} />
          </button>
        </>
      )}
    </div>
  );
};
