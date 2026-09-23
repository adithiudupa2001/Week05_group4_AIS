import React from 'react';
import { ActionType, ScreenType } from '../types';

interface FooterProps {
  onNavigate: (screen: ScreenType | ActionType) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="mt-12 sm:mt-16 border-t border-[#E8E1DA] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 pb-8 border-b border-[#F2EDE8]">
          {/* Col 1 */}
          <div className="space-y-3 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🐾</span>
              <span className="font-extrabold text-base text-warmgray-900">Paws &amp; Home SG</span>
            </div>
            <p className="text-xs text-warmgray-600 leading-relaxed">
              Registered volunteer-run society dedicated to the protection, ethical rehabilitation, and community adoption of Singapore&rsquo;s street animals.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-warmgray-900 mb-3">
              Rescue Shelter
            </h5>
            <p className="text-xs text-warmgray-600 leading-relaxed">
              71 Pasir Ris Farmway 1<br />
              Singapore 519344<br />
              Visits: Sat &amp; Sun (By Appt)
            </p>
          </div>

          {/* Col 3 */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-warmgray-900 mb-3">
              Community Links
            </h5>
            <ul className="space-y-1.5 text-xs text-warmgray-600">
              <li>
                <button
                  type="button"
                  className="hover:text-terracotta-600 transition-colors"
                  onClick={() => onNavigate('adopt')}
                >
                  Browse Rescues
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hover:text-amber-800 transition-colors font-medium"
                  onClick={() => onNavigate('visit')}
                >
                  Book a Shelter Visit
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hover:text-terracotta-600 transition-colors font-medium"
                  onClick={() => onNavigate('enquiry')}
                >
                  Adoption Enquiry
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="hover:text-terracotta-600 transition-colors"
                  onClick={() => {
                    const el = document.getElementById('how-do-i-get-there-panel');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  How Do I Get There?
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-wider text-warmgray-900 mb-3">
              Adoption Helpline
            </h5>
            <p className="text-xs text-warmgray-600 leading-relaxed">
              WhatsApp: +65 6789 2024<br />
              Email: care@pawsandhomesg.org<br />
              Available 10am - 7pm daily
            </p>
          </div>
        </div>

        {/* Mandatory Student Project and Open Data Disclaimers */}
        <div className="pt-6 space-y-3 text-xs text-warmgray-600 border-b border-[#F2EDE8] pb-6">
          <p className="leading-relaxed">
            Contains information from LTA DataMall Bus Arrival and Bus Routes, and from the data.gov.sg two-hour weather forecast, accessed 13 September 2026, made available under the terms of the Singapore Open Data Licence version 1.0, data.gov.sg/open-data-licence.
          </p>
          <p className="leading-relaxed font-medium text-warmgray-700">
            This is a student project and is not affiliated with, nor endorsed by, the Land Transport Authority or any animal welfare organisation.
          </p>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-warmgray-500 gap-2 text-center sm:text-left">
          <p>&copy; {new Date().getFullYear()} Paws &amp; Home SG. Student project for SMU MGMT 6110.</p>
          <p className="flex items-center gap-2 sm:gap-3">
            <span>Pasir Ris Facility</span>
            <span>•</span>
            <span>Example stray rescue profiles</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
