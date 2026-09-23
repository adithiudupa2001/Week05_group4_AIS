import { useState } from 'react';
import { Header } from './components/Header';
import { AdoptScreen } from './components/AdoptScreen';
import { Footer } from './components/Footer';
import { EnquiryModal } from './components/EnquiryModal';
import { ANIMALS } from './data';
import { ActionType, Animal } from './types';

export default function App() {
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null);
  const [selectedAction, setSelectedAction] = useState<ActionType>('adopt');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelectAction = (animal: Animal, action: ActionType) => {
    setSelectedAnimal(animal);
    setSelectedAction(action);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFooterNavigate = () => {
    const el = document.getElementById('rescues-heading');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF7F2] text-warmgray-800 font-sans selection:bg-orange-100 selection:text-terracotta-600 antialiased">
      <div aria-hidden={isModalOpen ? 'true' : undefined} className="flex flex-col min-h-screen justify-between">
        {/* Visible Student Project Notice Banner near top of screen */}
        <aside
          id="student-project-disclaimer-banner"
          aria-label="Student project notice"
          className="bg-amber-100 border-b border-amber-200/90 text-amber-950 px-4 py-2 text-xs sm:text-sm text-center font-semibold"
        >
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
            <span>🎓</span>
            <span>
              A student project for MGMT 6110 at Singapore Management University. Paws &amp; Home SG is not a real organisation and the animals shown are examples.
            </span>
          </div>
        </aside>

        {/* Sticky Global Navigation */}
        <Header />

        {/* Main View Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 w-full flex-grow">
          <AdoptScreen animals={ANIMALS} onSelectAction={handleSelectAction} />
        </main>

        {/* Global Reassurance Footer */}
        <Footer onNavigate={handleFooterNavigate} />
      </div>

      {/* Modal Dialog for Adoption Enquiry or Visit Booking */}
      <EnquiryModal
        isOpen={isModalOpen}
        actionType={selectedAction}
        initialAnimal={selectedAnimal}
        allAnimals={ANIMALS}
        onClose={handleCloseModal}
      />
    </div>
  );
}
