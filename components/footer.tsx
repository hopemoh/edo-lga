"use client"

import { motion } from "framer-motion"

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-foreground text-background py-12 px-4 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-2">Edo State</h3>
            <p className="text-background/70 text-sm">
              Discover the heartbeat of Nigeria and explore our vibrant communities.
            </p>
          </motion.div>

          {/* Quick Links */}
         {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Map
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-background transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </motion.div>*/}

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li>Benin City, Edo State</li>
              <li>Nigeria</li>
              <li>
                <a href="mailto:info@edostate.gov.ng" className="hover:text-background transition-colors">
                  info@edostate.gov.ng
                </a>
              </li>
            </ul>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Follow Us</h4>
            <div className="flex gap-4">
              {["Twitter", "Facebook", "Instagram"].map((social) => (
                <motion.a
                  key={social}
                  href="#"
                  whileHover={{ scale: 1.1 }}
                  className="w-10 h-10 rounded-full border border-background/30 flex items-center justify-center hover:border-background hover:bg-background/10 transition-all"
                >
                  <span className="sr-only">{social}</span>
                  {social.charAt(0)}
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Divider */}
        <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
          <p>&copy; {currentYear} Edo State. All rights reserved. Proudly showcasing Nigerian Heritage.</p>
        </div>
      </div>
    </footer>
  )
}
