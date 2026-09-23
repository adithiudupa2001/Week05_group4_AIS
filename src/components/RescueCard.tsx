import React from 'react';
import { Heart } from 'lucide-react';
import { ActionType, Animal } from '../types';

interface RescueCardProps {
  animal: Animal;
  onSelectAction: (animal: Animal, action: ActionType) => void;
  isSaved?: boolean;
  onToggleSave?: (animalId: string) => void;
}

export const RescueCard: React.FC<RescueCardProps> = ({
  animal,
  onSelectAction,
  isSaved = false,
  onToggleSave
}) => {
  return (
    <article
      id={`rescue-card-${animal.id}`}
      className="bg-white rounded-3xl border border-[#E8E1DA] overflow-hidden shadow-xs hover:shadow-md hover:border-terracotta-300 transition-all flex flex-col justify-between group"
    >
      <div>
        {/* Photo & Badges */}
        <div className="relative aspect-[16/11] w-full bg-warmgray-100 overflow-hidden">
          <img
            src={animal.image}
            alt={animal.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="absolute top-3 left-3">
            <span className="text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs backdrop-blur-md bg-amber-100/95 text-amber-900 border border-amber-300">
              Example Rescue
            </span>
          </div>
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            <span className="badge-soft-green text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs backdrop-blur-md">
              ✓ Vaccinated
            </span>
            <span className="badge-soft-orange text-[10px] sm:text-[11px] font-extrabold px-2.5 py-0.5 sm:py-1 rounded-full shadow-xs backdrop-blur-md">
              ✓ Dewormed
            </span>
          </div>
          <div className="absolute bottom-3 left-3 bg-warmgray-900/85 backdrop-blur-md text-white px-3 py-1 rounded-xl text-xs font-semibold shadow-xs">
            {animal.category}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xl font-black text-warmgray-900 tracking-tight">
              {animal.name}
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-warmgray-600 bg-warmgray-100 px-2.5 py-0.5 rounded-full border border-warmgray-200/50">
                {animal.age}
              </span>
              {/* Save / Heart Action */}
              <button
                type="button"
                onClick={() => onToggleSave?.(animal.id)}
                aria-label={isSaved ? `Remove ${animal.name} from saved pets` : `Save ${animal.name}`}
                title={isSaved ? `Remove ${animal.name} from saved` : `Save ${animal.name}`}
                className="p-1 rounded-full hover:bg-rose-50 transition-colors focus:outline-none"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isSaved
                      ? 'fill-rose-500 text-rose-500'
                      : 'text-warmgray-400 hover:text-rose-500'
                  }`}
                />
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-[13px] text-warmgray-600 mt-2 leading-relaxed">
            {animal.story}
          </p>

          {/* Quick tags */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-warmgray-500 font-medium">
            <span>{animal.gender}</span>
            <span>•</span>
            <span>{animal.size}</span>
            <span>•</span>
            <span className="text-terracotta-600 font-semibold">{animal.temperament}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Adopt me and Schedule a visit kept unchanged */}
      <div className="p-4 sm:p-5 pt-0 sm:pt-0">
        <div className="pt-3.5 border-t border-[#F2EDE8] grid grid-cols-2 gap-2.5">
          <button
            id={`btn-visit-${animal.id}`}
            type="button"
            onClick={() => onSelectAction(animal, 'visit')}
            className="touch-target py-3 px-3 bg-warmgray-100 hover:bg-warmgray-200 active:bg-warmgray-300 text-warmgray-800 text-xs sm:text-sm font-bold rounded-2xl text-center transition-all tap-scale flex items-center justify-center border border-[#E0D8D0]"
            aria-label={`Schedule a visit with ${animal.name}`}
          >
            Schedule a visit
          </button>
          <button
            id={`btn-adopt-${animal.id}`}
            type="button"
            onClick={() => onSelectAction(animal, 'adopt')}
            className="touch-target py-3 px-3 bg-terracotta-500 hover:bg-terracotta-600 active:bg-terracotta-700 text-white text-xs sm:text-sm font-bold rounded-2xl text-center transition-all tap-scale shadow-sm flex items-center justify-center"
            aria-label={`Adopt ${animal.name}`}
          >
            Adopt me
          </button>
        </div>
      </div>
    </article>
  );
};
