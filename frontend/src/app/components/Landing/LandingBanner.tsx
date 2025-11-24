"use client";

import React from "react";
import Image from "next/image";
import { motion } from "framer-motion";

const LandingBanner: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut" as const,
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <section className="bg-white w-full pt-0 pb-16 px-4">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
        className="max-w-5xl mx-auto relative rounded-2xl text-center overflow-hidden shadow-lg"
      >
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/imgs/banner.jpg"
            alt="Banner Background"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* Content */}
        <div className="relative z-10 px-4 sm:px-10 py-12">
          <motion.h2
            variants={itemVariants}
            className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg"
          >
            Ready to Start Creating?
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-white text-base md:text-lg mb-6 drop-shadow-md"
          >
            Join thousands of creatives and start your challenge journey today
          </motion.p>

          <motion.form
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-lg mx-auto"
          >
            <input
              type="email"
              placeholder="Enter Your E-mail"
              className="w-full sm:flex-1 px-4 py-3 rounded-3xl bg-white/95 text-black placeholder-[#B0B0B8] focus:outline-none border-none shadow-md"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="px-6 py-3 rounded-3xl text-black bg-[#EFEEEC] hover:bg-[#D6D4D1] transition shadow-md border-none"
            >
              Get Started
            </motion.button>
          </motion.form>

          <motion.p
            variants={itemVariants}
            className="text-sm text-white mt-4 font-semibold drop-shadow-md"
          >
            <span>No credit card required.</span> Start for free.
          </motion.p>
        </div>
      </motion.div>
    </section>
  );
};

export default LandingBanner;

