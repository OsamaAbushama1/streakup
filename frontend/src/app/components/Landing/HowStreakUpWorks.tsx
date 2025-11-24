"use client";

import React from "react";
import Image from "next/image";

import { motion } from "framer-motion";

import { FaCheckCircle, FaLightbulb, FaTrophy } from "react-icons/fa";

const HowStreakUpWorks: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const iconVariants = {
    hover: { scale: 1.2, rotate: 10, transition: { type: "spring", stiffness: 300 } },
  };

  const bounceVariant = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  const pulseVariant = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [1, 0.8, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    },
  };

  const shakeVariant = {
    animate: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut" as const,
        repeatDelay: 1
      },
    },
  };


  return (
    <section className="bg-white relative flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-6 md:px-12 lg:px-8 py-12 sm:py-16">
      <div className="container mx-auto xl:max-w-7xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#8981FA] mb-4">
            How StreakUp Challenges Work
          </h2>
          <p className="text-[#A8A8A8] text-sm sm:text-lg md:text-lg leading-relaxed mb-10">
            Accept tasks, earn points, and watch your progress turn into a real
            portfolio
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <motion.div variants={itemVariants} className="relative rounded-lg p-[2px] bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)]">
            <div className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center">
                <motion.div variants={bounceVariant} animate="animate">
                  <FaCheckCircle className="text-5xl md:text-6xl text-[#8981FA]" />
                </motion.div>
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
          </motion.div>

          <motion.div variants={itemVariants} className="relative rounded-lg p-[2px] bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)]">
            <div className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center">
                <motion.div variants={pulseVariant} animate="animate">
                  <FaLightbulb className="text-5xl md:text-6xl text-[#FFDD65]" />
                </motion.div>
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
          </motion.div>

          <motion.div variants={itemVariants} className="relative rounded-lg p-[2px] bg-[linear-gradient(to_right,#FFDD65,#FFD9DD,#DEB5FF,#AAEBFF,#C1BCFF,#C173FF)]">
            <div className="bg-white rounded-lg p-4 shadow-lg hover:shadow-xl transition flex flex-col items-center text-center h-full">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full flex items-center justify-center">
                <motion.div variants={shakeVariant} animate="animate">
                  <FaTrophy className="text-5xl md:text-6xl text-[#FFD700]" />
                </motion.div>
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HowStreakUpWorks;
