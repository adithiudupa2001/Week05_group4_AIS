import React, { useState } from 'react';
import { Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { ActionType, Animal } from '../types';
import { RescueCard } from './RescueCard';
import { ShelterVisitPlanningSection } from './ShelterVisitPlanningSection';

interface AdoptScreenProps {
  animals: Animal[];
  onSelectAction: (animal: Animal, action: ActionType) => void;
}

export const AdoptScreen: React.FC<AdoptScreenProps> = ({ animals, onSelectAction }) => {
  const [filter, setFilter] = useState<'all' | 'dogs' | 'cats' | 'saved'>('all');
  const [showAllRescues, setShowAllRescues] = useState<boolean>(false);

  // Heuristic #7: Persistent Saved Pets in localStorage
  const [savedPetIds, setSavedPetIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('paws_saved_pets');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleToggleSave = (animalId: string) => {
    setSavedPetIds((prev) => {
      const next = prev.includes(animalId)
        ? prev.filter((id) => id !== animalId)
        : [...prev, animalId];
      try {
        localStorage.setItem('paws_saved_pets', JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  const filteredAnimals = animals.filter((animal) => {
    if (filter === 'saved') {
      return savedPetIds.includes(animal.id);
    }
    if (filter === 'dogs') {
      return animal.category.includes('Special') || animal.category.includes('Hound');
    }
    if (filter === 'cats') {
      return animal.category.includes('Shorthair') || animal.category.includes('Tabby') || animal.category.includes('Cat');
    }
    return true;
  });

  // Heuristic #8: Aesthetic & Minimalist Design - Show only 4 rescue cards initially
  const displayedAnimals = showAllRescues ? filteredAnimals : filteredAnimals.slice(0, 4);

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Hero Section */}
      <section
        id="hero-banner"
        className="relative overflow-hidden bg-gradient-to-br from-terracotta-50 via-white to-[#FFF5EE] border border-terracotta-200/80 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs"
      >
        <div className="max-w-4xl">
          <div className="inline-flex flex-wrap items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-white/90 border border-terracotta-200 text-terracotta-600 text-[11px] sm:text-xs font-bold tracking-wide uppercase shadow-xs mb-3 sm:mb-4">
            <span>🇸🇬</span>
            <span>Singapore Stray Initiative</span>
            <span className="hidden sm:inline text-terracotta-300">•</span>
            <span className="hidden sm:inline text-warmgray-600 font-medium lowercase first-letter:uppercase">
              HDB approved companion matchmakers
            </span>
          </div>

          <h2 className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-warmgray-900 tracking-tight leading-[1.3] sm:leading-tight">
            &ldquo;Every Singapore stray deserves a safe porch and a gentle hand.&rdquo;
          </h2>

          <p className="mt-2.5 sm:mt-4 text-xs sm:text-base lg:text-lg text-warmgray-600 sm:text-warmgray-700 leading-relaxed max-w-3xl">
            We bridge the gap between Singapore&rsquo;s back-alley rescues and loving first-time adopters with compassionate shelter care, patient matching, and lifelong aftercare.
          </p>

          <div className="mt-3.5 sm:mt-6 pt-3 sm:pt-5 border-t border-terracotta-200/60 flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm font-semibold text-warmgray-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>8 rescues ready for Pasir Ris shelter visits or direct rehoming</span>
            </div>
            <span className="hidden md:inline text-warmgray-300">•</span>
            <div className="hidden sm:flex items-center gap-1.5 text-warmgray-600">
              <span className="text-terracotta-500 font-bold">✓</span> Sterilised &amp; Vaccinated
            </div>
            <span className="hidden md:inline text-warmgray-300">•</span>
            <div className="hidden sm:flex items-center gap-1.5 text-warmgray-600">
              <span className="text-terracotta-500 font-bold">✓</span> Hand-delivered to your door
            </div>
          </div>
        </div>
      </section>

      {/* Planning a visit to the shelter: Two live panels directly below hero & above rescues */}
      <ShelterVisitPlanningSection />

      {/* Mobile Only: How adoption works compact card */}
      <div className="block lg:hidden space-y-5">
        <div className="bg-white border border-[#E8E1DA] rounded-2xl p-4 sm:p-5 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-2xl bg-orange-100/80 text-terracotta-600 flex items-center justify-center font-bold text-base shrink-0 mt-0.5 shadow-xs">
              💡
            </div>
            <div className="space-y-2">
              <h3 className="font-bold text-sm text-warmgray-900">How adoption works</h3>
              <div className="space-y-1.5 text-xs leading-relaxed text-warmgray-600">
                <p>
                  <strong className="text-warmgray-900 font-bold">1. Schedule a visit:</strong> A friendly, zero-pressure meet-and-greet at our Pasir Ris shelter.
                </p>
                <p>
                  <strong className="text-warmgray-900 font-bold">2. Adopt me:</strong> Once approved, your completed adoption is gently hand-delivered to your home with settling guidance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid and Sidebar Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* Left / Main Column: Rescues Header & Cards */}
        <div className="lg:col-span-8 space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-[#E8E1DA]">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 id="rescues-heading" className="text-xl sm:text-2xl font-extrabold text-warmgray-900 tracking-tight">
                  Meet our rescues
                </h3>
                <span className="text-xs font-bold text-terracotta-600 bg-terracotta-50 px-3 py-1 rounded-full border border-terracotta-200">
                  {filteredAnimals.length} Available
                </span>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                  EXAMPLE DATA
                </span>
              </div>
              <p className="text-xs sm:text-sm text-warmgray-600 font-medium mt-0.5">
                Ready for Singapore HDB and condo homes
              </p>
            </div>

            {/* Filter Pills with Saved Filter */}
            <div className="flex flex-wrap items-center gap-1.5 bg-warmgray-100/80 p-1 rounded-xl border border-warmgray-200/60 self-start sm:self-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filter === 'all'
                    ? 'bg-white text-warmgray-900 font-bold shadow-xs'
                    : 'text-warmgray-600 hover:text-warmgray-900'
                }`}
              >
                All Rescues
              </button>
              <button
                type="button"
                onClick={() => setFilter('dogs')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filter === 'dogs'
                    ? 'bg-white text-warmgray-900 font-bold shadow-xs'
                    : 'text-warmgray-600 hover:text-warmgray-900'
                }`}
              >
                Dogs
              </button>
              <button
                type="button"
                onClick={() => setFilter('cats')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  filter === 'cats'
                    ? 'bg-white text-warmgray-900 font-bold shadow-xs'
                    : 'text-warmgray-600 hover:text-warmgray-900'
                }`}
              >
                Cats
              </button>
              <button
                type="button"
                onClick={() => setFilter('saved')}
                className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
                  filter === 'saved'
                    ? 'bg-white text-rose-600 font-bold shadow-xs'
                    : 'text-warmgray-600 hover:text-warmgray-900'
                }`}
              >
                <Heart
                  className={`w-3.5 h-3.5 ${
                    savedPetIds.length > 0 ? 'fill-rose-500 text-rose-500' : 'text-warmgray-400'
                  }`}
                />
                <span>Saved ({savedPetIds.length})</span>
              </button>
            </div>
          </div>

          {/* Empty state for Saved Rescues */}
          {filter === 'saved' && filteredAnimals.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-3xl border border-[#E8E1DA] space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto">
                <Heart className="w-6 h-6 fill-rose-500 text-rose-500" />
              </div>
              <h4 className="text-base font-bold text-warmgray-900">No saved rescues yet</h4>
              <p className="text-xs sm:text-sm text-warmgray-600 max-w-sm mx-auto leading-relaxed">
                Click the heart icon on any rescue card to save your favourite companions here for easy viewing.
              </p>
            </div>
          ) : (
            <>
              {/* Cards Grid: 1 col on mobile, 2 cols on tablet/desktop */}
              <div id="animals-grid" className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                {displayedAnimals.map((animal) => (
                  <RescueCard
                    key={animal.id}
                    animal={animal}
                    onSelectAction={onSelectAction}
                    isSaved={savedPetIds.includes(animal.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>

              {/* Heuristic #8: Expand/Collapse rescues if more than 4 */}
              {filteredAnimals.length > 4 && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setShowAllRescues(!showAllRescues)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white hover:bg-warmgray-50 border border-[#DDD2C6] text-warmgray-800 text-xs sm:text-sm font-bold shadow-xs hover:border-terracotta-300 transition-all focus:outline-none"
                  >
                    {showAllRescues ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-terracotta-500" />
                        <span>Show fewer rescues</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-terracotta-500" />
                        <span>View all rescues ({filteredAnimals.length})</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Sticky Sidebar on Desktop */}
        <aside className="hidden lg:block lg:col-span-4 space-y-6 sticky top-28">
          {/* How It Works Card */}
          <div className="bg-white border border-[#E8E1DA] rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2.5 pb-4 border-b border-[#F2EDE8]">
              <div className="w-9 h-9 rounded-xl bg-orange-100 text-terracotta-600 flex items-center justify-center font-bold text-base">
                💡
              </div>
              <div>
                <h3 className="font-extrabold text-base text-warmgray-900">How It Works</h3>
                <p className="text-xs text-warmgray-500 font-medium">Two thoughtful paths to welcoming a pet</p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {/* Step 1 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E0]">
                <div className="w-7 h-7 rounded-lg bg-terracotta-500 text-white flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-sm text-warmgray-900">Schedule a visit</h4>
                  <p className="text-xs text-warmgray-600 mt-1 leading-relaxed">
                    A friendly, zero-pressure meet-and-greet happens in our calm interaction pen at our{' '}
                    <strong>Pasir Ris shelter</strong>. Perfect if you&rsquo;d like to get to know their energy first.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EFE8E0]">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-extrabold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-sm text-warmgray-900">Adopt me</h4>
                  <p className="text-xs text-warmgray-600 mt-1 leading-relaxed">
                    Once your adoption questionnaire is approved, your chosen companion is{' '}
                    <strong>gently hand-delivered to your home</strong> with food starter packs and settling-in guidance.
                  </p>
                </div>
              </div>
            </div>

            {/* Visit Checklist */}
            <div className="mt-5 pt-4 border-t border-[#F2EDE8]">
              <h5 className="font-bold text-xs uppercase tracking-wider text-warmgray-500 mb-2.5">
                Shelter Visit Preparation
              </h5>
              <ul className="space-y-2 text-xs text-warmgray-700">
                <li className="flex items-center gap-2">
                  <span className="text-terracotta-500 font-bold">✓</span> Wear comfortable casual footwear &amp; light clothing
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-terracotta-500 font-bold">✓</span> All household members are warmly encouraged to join
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-terracotta-500 font-bold">✓</span> 45-minute calm interaction with volunteer handler
                </li>
              </ul>
            </div>
          </div>

          {/* Shelter Location Card */}
          <div className="bg-gradient-to-br from-white to-[#FBF8F4] border border-[#E8E1DA] rounded-3xl p-6 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-terracotta-600">
              <span>📍</span> Shelter Facility
            </div>
            <h4 className="font-extrabold text-base text-warmgray-900 leading-snug">
              Pasir Ris Farmway Sanctuary
            </h4>
            <p className="text-xs text-warmgray-600 leading-relaxed">
              71 Pasir Ris Farmway 1, Singapore 519344<br />
              <span className="text-warmgray-500 font-medium">
                Free parking on premises • 10 min bus from Pasir Ris MRT
              </span>
            </p>
            <div className="pt-2 border-t border-[#EFE8E0] flex items-center justify-between text-xs font-semibold">
              <span className="text-warmgray-600">Weekend visiting slots:</span>
              <span className="text-warmgray-900 font-bold">10:30am &ndash; 5:30pm</span>
            </div>
          </div>
        </aside>
      </section>

      {/* Our Story & Care Pillars */}
      <section className="bg-white border border-[#E8E1DA] rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs space-y-4 sm:space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-terracotta-600 text-xs font-bold mb-2">
            🌱 Our Story &amp; Care Pillars
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-warmgray-900 tracking-tight">
            Grounded Community Compassion
          </h3>
          <p className="text-xs sm:text-sm text-warmgray-600 mt-1 leading-relaxed">
            Paws &amp; Home SG started with daily caregivers in Bedok and Kranji who realized feeding alone wasn&rsquo;t enough. We operate on three community pillars:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 pt-1">
          {/* Pillar 1 */}
          <div className="bg-warmgray-50 border border-[#EFE8E0] p-4 sm:p-6 rounded-2xl hover:border-terracotta-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-[#E8E1DA] flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-3 sm:mb-4">
                🥣
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-warmgray-900">
                Street Feeding &amp; Monitoring
              </h4>
              <p className="text-xs text-warmgray-600 mt-1.5 sm:mt-2 leading-relaxed">
                Quiet nightly feeding rounds in Bedok, Kranji, and Tuas industrial zones to track stray health, individual temperament, pack dynamics, and territorial safety.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-[#E8E1DA]/60 text-[11px] font-bold text-terracotta-600 uppercase tracking-wider">
              Active Feeding Zones
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-warmgray-50 border border-[#EFE8E0] p-4 sm:p-6 rounded-2xl hover:border-terracotta-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-[#E8E1DA] flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-3 sm:mb-4">
                💉
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-warmgray-900">
                Vaccination &amp; Sterilisation
              </h4>
              <p className="text-xs text-warmgray-600 mt-1.5 sm:mt-2 leading-relaxed">
                Every single rescue undergoes comprehensive health screenings, vet certification, microchipping, full core vaccinations, parasite clearing, and humane sterilisation.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-[#E8E1DA]/60 text-[11px] font-bold text-terracotta-600 uppercase tracking-wider">
              Medically Cleared
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-warmgray-50 border border-[#EFE8E0] p-4 sm:p-6 rounded-2xl hover:border-terracotta-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white border border-[#E8E1DA] flex items-center justify-center text-xl sm:text-2xl shadow-xs mb-3 sm:mb-4">
                🏡
              </div>
              <h4 className="font-extrabold text-sm sm:text-base text-warmgray-900">
                Community Sheltering
              </h4>
              <p className="text-xs text-warmgray-600 mt-1.5 sm:mt-2 leading-relaxed">
                Spacious Pasir Ris transition pens where once-fearful street rescues learn trusting human touch, gentle leash manners, litter etiquette, and household readiness.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-[#E8E1DA]/60 text-[11px] font-bold text-terracotta-600 uppercase tracking-wider">
              Care &amp; Quarantine
            </div>
          </div>
        </div>
      </section>

      {/* You Are Never Alone After Adoption Section */}
      <section className="bg-gradient-to-br from-[#FFFBF7] to-[#FDF8F3] border border-orange-200/80 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-xs space-y-4 sm:space-y-6">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-terracotta-200 text-terracotta-600 text-xs font-bold mb-2">
            🤝 Singapore Aftercare Promise
          </div>
          <h3 className="text-xl sm:text-2xl font-extrabold text-warmgray-900 tracking-tight">
            You Are Never Alone After Adoption
          </h3>
          <p className="text-xs sm:text-sm text-warmgray-600 mt-1 leading-relaxed">
            First-time pet parenting in an HDB or apartment can feel overwhelming. We walk alongside you through every settling phase with complimentary community support:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-6 pt-1">
          {/* Card 1 */}
          <div className="bg-white border border-orange-100 p-4 sm:p-6 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-terracotta-600 flex items-center justify-center font-extrabold text-lg mb-3 sm:mb-4">
                💬
              </div>
              <h4 className="font-bold text-sm sm:text-base text-warmgray-900">
                Dedicated Volunteer Buddy
              </h4>
              <p className="text-xs text-warmgray-600 mt-1.5 sm:mt-2 leading-relaxed">
                An experienced Singapore dog or cat parent is directly assigned to answer questions, settling-in doubts, and feeding advice during your initial adoption transition.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-orange-100/60 flex items-center gap-2 text-xs font-semibold text-warmgray-800">
              <span className="text-terracotta-500 font-bold">✓</span> 1-on-1 Guidance
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-orange-100 p-4 sm:p-6 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-terracotta-600 flex items-center justify-center font-extrabold text-lg mb-3 sm:mb-4">
                📞
              </div>
              <h4 className="font-bold text-sm sm:text-base text-warmgray-900">
                Community Helpline
              </h4>
              <p className="text-xs text-warmgray-600 mt-1.5 sm:mt-2 leading-relaxed">
                Guidance on behavioral adjustment, sound sensitivity during thunderstorms, separation anxiety prevention, and HDB pet window grilles installation pointers.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-orange-100/60 flex items-center gap-2 text-xs font-semibold text-warmgray-800">
              <span className="text-terracotta-500 font-bold">✓</span> Helpline Support
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white border border-orange-100 p-4 sm:p-6 rounded-2xl shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-terracotta-600 flex items-center justify-center font-extrabold text-lg mb-3 sm:mb-4">
                🩺
              </div>
              <h4 className="font-bold text-sm sm:text-base text-warmgray-900">
                Subsidised Vet Partners
              </h4>
              <p className="text-xs text-warmgray-600 mt-1.5 sm:mt-2 leading-relaxed">
                Enjoy exclusive discounted annual wellness checkups, booster jabs, dental scalings, and routine preventatives across our trusted veterinary partner clinics islandwide.
              </p>
            </div>
            <div className="mt-3.5 pt-2.5 sm:pt-3 border-t border-orange-100/60 flex items-center gap-2 text-xs font-semibold text-warmgray-800">
              <span className="text-terracotta-500 font-bold">✓</span> Islandwide Partner Clinics
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

