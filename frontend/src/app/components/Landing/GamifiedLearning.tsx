"use client";

import React from "react";
import Image from "next/image";

const GamifiedLearning: React.FC = () => {
  return (
    <section className="relative flex flex-col items-center justify-center min-h-[60vh] bg-[#F4E5FF] px-4 sm:px-6 md:px-12 lg:px-8 py-12 sm:py-16">
      <div className="container mx-auto xl:max-w-7xl text-center">
        <h2 className="text-3xl sm:text-3xl md:text-4xl font-extrabold text-[#000000] mb-4">
          Gamified Learning Experience
        </h2>
        <p className="text-[#2E2E38] text-sm sm:text-lg md:text-lg leading-relaxed mb-10">
          Boost your creativity through the challenges, streaks, and badges
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          <div className="bg-white/80 rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
              }}
            >
              <Image
                src="/imgs/streak.png"
                alt="Streak System Icon"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-[#000000] mb-2">
                Streak System
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base">
                Maintain daily activity streaks to unlock exclusive badges and
                multiply your points.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
              }}
            >
              <Image
                src="/imgs/star-neaticons.png"
                alt="Points & Rewards Icon"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-[#000000] mb-2">
                Points & Rewards
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base">
                Earn points from challenges and engagement. Redeem for
                mentorship and course discounts.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
              }}
            >
              <Image
                src="/imgs/email.png"
                alt="Certified Achievement Icon"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-[#000000] mb-2">
                Certified Achievement
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base">
                Finish the challenge and unlock a certificate to showcase your
                skills.
              </p>
            </div>
          </div>

          <div className="bg-white/80 rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #FFDD65, #FFD9DD, #DEB5FF, #AAEBFF, #C1BCFF, #C173FF)",
              }}
            >
              <Image
                src="/imgs/users.png"
                alt="Community Feedback Icon"
                width={32}
                height={32}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-9 md:h-9 object-contain"
              />
            </div>
            <div className="text-center sm:text-left">
              <h3 className="text-lg sm:text-xl font-semibold text-[#000000] mb-2">
                Community Feedback
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base">
                Get likes, comments, and constructive ratings from fellow
                creatives to help you improve your work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GamifiedLearning;
