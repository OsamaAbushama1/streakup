"use client";

import React from "react";
import Image from "next/image";

const HowStreakUpWorks: React.FC = () => {
  return (
    <section className="bg-white relative flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-6 md:px-12 lg:px-8 py-12 sm:py-16">
      <div className="container mx-auto xl:max-w-7xl text-center">
        <h2 className="text-3xl sm:text-3xl md:text-4xl font-extrabold text-[#000000] mb-4">
          How StreakUp Challenges Work
        </h2>
        <p className="text-[#2E2E38] text-sm sm:text-lg md:text-lg leading-relaxed mb-10">
          Accept tasks, earn points, and watch your progress turn into a real
          portfolio
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="relative rounded-lg p-[2px] bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)]">
            <div className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center">
                <Image
                  src="/imgs/accept.png"
                  alt="Accept Challenge Icon"
                  width={96}
                  height={96}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>

              <h3 className="text-xl font-semibold text-[#000000] mb-2 flex items-center justify-center gap-2">
                <span className="font-bold text-2xl">1.</span>
                Accept Challenge
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base max-w-xs">
                Choose from UI design, frontend dev, or graphic art challenges.
                Each one includes clear steps and goals to follow.
              </p>
            </div>
          </div>

          <div className="relative rounded-lg p-[2px] bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)]">
            <div className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center">
                <Image
                  src="/imgs/create-learn.png"
                  alt="Create & Learn Icon"
                  width={96}
                  height={96}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>

              <h3 className="text-xl font-semibold text-[#000000] mb-2 flex items-center justify-center gap-2">
                <span className="font-bold text-2xl">2.</span>
                Create & Learn
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base max-w-xs">
                Follow structured guides or go freestyle. Learn new techniques
                while building real, creative projects.
              </p>
            </div>
          </div>

          <div className="relative rounded-lg p-[2px] bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)]">
            <div className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center">
                <Image
                  src="/imgs/share-earn.png"
                  alt="Share & Earn Icon"
                  width={96}
                  height={96}
                  className="w-12 h-12 md:w-14 md:h-14 object-contain"
                />
              </div>

              <h3 className="text-xl font-semibold text-[#000000] mb-2 flex items-center justify-center gap-2">
                <span className="font-bold text-2xl">3.</span>
                Share & Earn
              </h3>
              <p className="text-[#6d6f72] text-sm sm:text-base max-w-xs">
                Submit your work, get feedback, earn points, and keep your
                streak going for rewards and recognition.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowStreakUpWorks;
