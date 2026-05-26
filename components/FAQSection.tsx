'use client'
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'How does the project process work?',
    answer: 'Choose your service, submit your project requirements, and place your order. Our team will review your request, then send you a detailed quote including pricing, timeline, and project scope before work begins.',
  },
  {
    question: 'How are pricing and timelines determined?',
    answer: 'Every project is reviewed individually based on complexity, features, and delivery expectations. After reviewing your requirements, we provide a final price, estimated timeline, deposit amount, and project plan.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We currently accept secure cryptocurrency payments including USDT TRC20. Deposit and remaining payment instructions are sent after project review and approval.',
  },
  {
    question: 'Can I track my project progress?',
    answer: 'Yes. Every client receives a unique Order ID and access to real-time order tracking, project updates, status changes, file delivery, and direct communication with our team.',
  },
  {
    question: 'Do you offer revisions and support?',
    answer: 'Yes. Revision support is included to ensure the final result meets the agreed project scope and quality standards. Additional support is also available after delivery if needed.',
  },
  {
    question: 'Is my information and project kept private?',
    answer: 'Absolutely. All client information, files, and project details are handled confidentially. Your data is never shared with third parties.',
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