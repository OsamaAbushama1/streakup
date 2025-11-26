"use client";

import React from "react";
import Image from "next/image";

import { motion } from "framer-motion";

const GamifiedLearning: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <section className="relative flex flex-col items-center justify-center min-h-[60vh] bg-[#FFFFFF] px-4 sm:px-6 md:px-12 lg:px-8 py-6 sm:py-8">
      <div className="container mx-auto xl:max-w-7xl text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#8981FA] mb-4">
            Gamified Learning Experience
          </h2>
          <p className="text-[#A8A8A8] text-sm sm:text-lg md:text-lg leading-relaxed mb-10">
            Boost your creativity through the challenges, streaks, and badges
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6"
        >
          <motion.div variants={itemVariants} className="bg-[#F0F0FF] rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center bg-[#ffffff]"

            >
              <Image
                src="/imgs/Fire.png"
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
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#F0F0FF] rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center bg-[#ffffff]"

            >
              <Image
                src="/imgs/star.png"
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
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#F0F0FF] rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center bg-[#ffffff]"

            >
              <Image
                src="/imgs/Rhombus.png"
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
          </motion.div>

          <motion.div variants={itemVariants} className="bg-[#F0F0FF] rounded-lg p-6 shadow-lg hover:shadow-xl transition flex flex-col sm:flex-row items-center sm:items-center gap-4">
            <div
              className="flex-shrink-0 w-[60px] h-[60px] rounded-xl flex items-center justify-center bg-[#ffffff]"

            >
              <Image
                src="/imgs/Face-Laugh.png"
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
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default GamifiedLearning;
