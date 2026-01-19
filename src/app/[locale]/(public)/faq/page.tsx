import { useTranslations } from "next-intl"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const faqs = [
  {
    question: "ต้องมีเอกสารอะไรบ้างในการเช่ารถ?",
    answer:
      "คุณต้องมีบัตรประชาชน ใบขับขี่ที่ยังไม่หมดอายุ และสำหรับบางรถอาจต้องมีบัตรเครดิตสำหรับวางเงินประกัน",
  },
  {
    question: "สามารถยกเลิกการจองได้หรือไม่?",
    answer:
      "ได้ คุณสามารถยกเลิกการจองได้ก่อนวันรับรถ โดยเงื่อนไขการคืนเงินขึ้นอยู่กับนโยบายของแต่ละร้านเช่า",
  },
  {
    question: "มีประกันภัยรถยนต์หรือไม่?",
    answer:
      "รถทุกคันมีประกันภัยภาคบังคับ (พ.ร.บ.) และประกันชั้น 1 หรือชั้น 2 ตามที่ร้านเช่ากำหนด รายละเอียดจะแสดงในหน้ารายละเอียดรถ",
  },
  {
    question: "ต้องจองล่วงหน้ากี่วัน?",
    answer:
      "ขึ้นอยู่กับร้านเช่าแต่ละแห่ง โดยทั่วไปแนะนำให้จองล่วงหน้าอย่างน้อย 24 ชั่วโมง เพื่อให้ร้านเตรียมรถได้ทัน",
  },
  {
    question: "สามารถรับรถที่สนามบินได้หรือไม่?",
    answer:
      "ได้ ร้านเช่าหลายแห่งให้บริการรับ-ส่งรถที่สนามบิน กรุณาระบุสถานที่รับรถเป็นสนามบินที่ต้องการ",
  },
  {
    question: "มีค่าใช้จ่ายเพิ่มเติมหรือไม่?",
    answer:
      "ราคาที่แสดงเป็นราคาเช่ารถต่อวัน อาจมีค่าใช้จ่ายเพิ่มเติมสำหรับบริการพิเศษ เช่น ค่าส่งรถนอกสถานที่ ค่าที่นั่งเด็ก หรือค่าน้ำมัน",
  },
  {
    question: "ใช้บัตรเครดิตของคนอื่นได้หรือไม่?",
    answer:
      "ไม่ได้ บัตรเครดิตที่ใช้ต้องเป็นชื่อของผู้เช่าเท่านั้น เพื่อความปลอดภัยและเป็นไปตามข้อกำหนดของบริษัทประกัน",
  },
  {
    question: "สามารถขับรถข้ามจังหวัดได้หรือไม่?",
    answer:
      "ได้ แต่ควรแจ้งร้านเช่าล่วงหน้า บางร้านอาจมีข้อจำกัดหรือค่าใช้จ่ายเพิ่มเติมสำหรับการขับข้ามจังหวัด",
  },
]

export default function FAQPage() {
  const t = useTranslations()

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("nav.faq")}</h1>
          <p className="text-xl text-muted-foreground">
            คำถามที่พบบ่อยเกี่ยวกับการเช่ารถ
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-12 text-center p-6 bg-muted rounded-lg">
          <h3 className="font-semibold mb-2">ยังมีคำถามอื่นอีกไหม?</h3>
          <p className="text-muted-foreground mb-4">
            ติดต่อทีมงานของเราได้ที่ support@jongrod.com
          </p>
        </div>
      </div>
    </div>
  )
}
