import { useState, useEffect } from 'react'

const BannerCarousel = ({ banners = [] }) => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (banners.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length)
    }, 4500)

    return () => clearInterval(interval)
  }, [banners.length])

  if (!banners.length) return null

  const currentBanner = banners[currentIndex]

  return (
    <div className="relative w-full rounded-3xl overflow-hidden shadow-md bg-slate-900 aspect-21/9 sm:aspect-3/1 md:aspect-4/1 lg:aspect-21/6">
      {/* Background Image with Gradient Overlay */}
      <img
        src={currentBanner.image}
        alt={currentBanner.title}
        className="w-full h-full object-cover opacity-80 transition-all duration-700"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 sm:p-6 text-white">
        <span className="inline-block self-start px-2.5 py-0.5 rounded-md bg-orange-600 text-[10px] font-bold uppercase tracking-wider mb-1">
          Special Offer
        </span>
        <h2 className="text-base sm:text-xl font-extrabold line-clamp-1 leading-tight">
          {currentBanner.title}
        </h2>
        {currentBanner.description && (
          <p className="text-xs sm:text-sm text-slate-200 line-clamp-2 mt-0.5 max-w-md">
            {currentBanner.description}
          </p>
        )}
      </div>

      {/* Slide Dots Indicator */}
      {banners.length > 1 && (
        <div className="absolute bottom-2.5 right-3 flex items-center gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentIndex ? 'w-5 bg-orange-500' : 'w-1.5 bg-white/60'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default BannerCarousel
