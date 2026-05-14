'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How does the order process work?',
    answer: 'Simply choose your service, provide your email and project requirements, and submit your order. We will review your request and contact you within 24 hours to confirm details and timeline.',
  },
  {
    question: 'How long does it take to complete a project?',
    answer: 'Most projects are completed within 3-7 days depending on complexity. Graduation projects typically take 5-7 days, academic reports 3-5 days, and websites/apps 5-10 days. Rush delivery is available upon request.',
  },
  {
    question: 'Is my information kept private?',
    answer: 'Absolutely. We take privacy seriously. Your email and project details are only used to communicate with you about your order. We never share your information with third parties.',
  },
  {
    question: 'What if I need revisions?',
    answer: 'We offer unlimited revisions on all orders. If something is not exactly how you want it, just let us know and we will make the necessary changes at no extra cost.',
  },
  {
    question: 'How do I track my order status?',
    answer: 'You can track your order anytime using our Track Order page. Just enter your Order ID (sent to your email after placing the order) to see real-time status updates.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We currently work on a project basis. After reviewing your requirements, we will send you a confirmation email with payment details. We accept various payment methods which will be discussed during the confirmation process.',
  },
]

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground text-lg">
            Everything you need to know about our services
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-border bg-card hover:shadow-sm transition-all"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-foreground pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform duration-300 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96 pb-5 px-5' : 'max-h-0'
                }`}
              >
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}