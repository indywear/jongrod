import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Users, Award, Target } from "lucide-react"

export default function AboutPage() {
  const t = useTranslations()

  const values = [
    {
      icon: Shield,
      title: "ปลอดภัย",
      description: "รถทุกคันผ่านการตรวจสอบคุณภาพก่อนให้บริการ",
    },
    {
      icon: Users,
      title: "ลูกค้าเป็นศูนย์กลาง",
      description: "บริการที่ใส่ใจและตอบสนองทุกความต้องการ",
    },
    {
      icon: Award,
      title: "คุณภาพ",
      description: "รถให้เช่าคุณภาพดีจากพาร์ทเนอร์ที่เราคัดสรร",
    },
    {
      icon: Target,
      title: "โปร่งใส",
      description: "ราคาชัดเจน ไม่มีค่าใช้จ่ายแอบแฝง",
    },
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{t("footer.about")}</h1>
          <p className="text-xl text-muted-foreground">
            แพลตฟอร์มเช่ารถออนไลน์ที่ครบวงจร
          </p>
        </div>

        <div className="prose prose-lg max-w-none mb-12">
          <p>
            Jongrod คือแพลตฟอร์มเช่ารถออนไลน์ที่รวบรวมรถให้เช่าจากร้านเช่ารถ
            และเจ้าของรถหลากหลายทั่วประเทศไทย ให้คุณสามารถค้นหา เปรียบเทียบ
            และจองรถได้อย่างง่ายดายในที่เดียว
          </p>
          <p>
            เราเชื่อมั่นว่าการเช่ารถควรเป็นเรื่องง่าย สะดวก และปลอดภัย
            ด้วยระบบที่ทันสมัยและทีมงานที่พร้อมให้บริการ
            คุณสามารถมั่นใจได้ว่าจะได้รับประสบการณ์เช่ารถที่ดีที่สุด
          </p>
        </div>

        <h2 className="text-2xl font-bold text-center mb-8">คุณค่าของเรา</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {values.map((value, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-primary/10">
                    <value.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
