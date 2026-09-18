"use client"

import { motion } from "framer-motion"
import { useContent } from "@/hooks/use-resources"

export default function Footer() {
  const { data: contentData } = useContent()
  const footerData = contentData?.find((item: any) => item.section === 'footer')
  const metadata = footerData?.metadata || {}

  const description = metadata.footerDescription || "Edo State Local Government Service Commission — Dedicated to transparent, efficient, and accountable public service across all 18 LGAs."
  const copyright = metadata.footerCopyright || `© ${new Date().getFullYear()} Edo State Local Government Service Commission. All rights reserved.`
  const links = metadata.footerLinks && metadata.footerLinks.length > 0
    ? metadata.footerLinks
    : [
        { label: 'Home', href: '/' },
        { label: 'Help', href: '/help' },
        { label: 'Login', href: '/login' },
      ]

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
              {description}
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true }}
          >
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-background/70">
              {links.map((link: { label: string; href: string }, i: number) => (
                <li key={i}>
                  <a href={link.href} className="hover:text-background transition-colors">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.div>

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
        </div>

        {/* Divider */}
        <div className="border-t border-background/20 pt-8 text-center text-sm text-background/60">
          <p>{copyright}</p>
        </div>
      </div>
    </footer>
  )
}
