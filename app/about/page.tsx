import Link from "next/link";
import { Film, Star, Heart, Database, ArrowRight } from "lucide-react";

export const revalidate = 86400; // Revalidate every day (ISR)

export const metadata = {
  title: "Hakkında | İzlediklerim",
  description:
    "İzlediklerim projesinin hikâyesi, amacı ve kişisel sinema arşivim hakkında bilgiler.",
};

export default function AboutPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      {/* Hero */}
      <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 to-black p-10">
        <div className="max-w-3xl">
          <div className="mb-6 flex flex-wrap items-center gap-5">
            <div className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-red-600/15">
              <Film className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
              Hakkında
            </h1>
          </div>
          <p className="text-lg leading-8 text-zinc-300">
            <strong>İzlediklerim</strong>, yıllardır izlediğim film ve dizileri
            kayıt altına almak, puanlamak ve kendi sinema arşivimi oluşturmak
            amacıyla geliştirdiğim kişisel bir projedir.
          </p>
        </div>
      </section>

      {/* Cards */}

      <section className="mt-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <div className="mb-5 flex items-center gap-4">
            <Database className="h-8 w-8 shrink-0 text-red-500" />

            <h2 className="text-xl font-semibold text-white">
              Neden Bu Site?
            </h2>
          </div>

          <p className="leading-8 text-zinc-300">
            Uzun yıllar boyunca izlediğim filmleri IMDb üzerinde puanladım,
            listeler oluşturdum ve arşivledim. Ancak zamanla bu koleksiyonun
            tamamen bana ait, daha hızlı ve daha özgür bir platformda yer
            almasını istedim.
          </p>

          <p className="mt-5 leading-8 text-zinc-300">
            Böylece İzlediklerim ortaya çıktı.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <div className="mb-5 flex items-center gap-4">
            <Star className="h-8 w-8 shrink-0 text-yellow-400" />
            <h2 className="text-xl font-semibold text-white">
              Puanlar Nasıl Veriliyor?
            </h2>
          </div>

          <p className="leading-8 text-zinc-300">
            Buradaki tüm puanlar tamamen kişisel görüşümü yansıtır.
          </p>

          <p className="mt-5 leading-8 text-zinc-300">
            IMDb veya TMDB puanlarıyla birebir örtüşmeyebilir. Aynı filmi yıllar
            sonra tekrar izlediğimde puanını değiştirebilirim.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <div className="mb-5 flex items-center gap-4">
            <Heart className="h-8 w-8 shrink-0 text-pink-500" />
            <h2 className="text-xl font-semibold text-white">
              Bu Sitede Neler Var?
            </h2>
          </div>

          <ul className="space-y-3 text-zinc-300">
            <li>• İzlediğim filmler ve diziler</li>
            <li>• Kişisel puanlarım</li>
            <li>• Favorilerim</li>
            <li>• Türlere göre koleksiyonlar</li>
            <li>• İstatistikler</li>
            <li>• Rastgele film önerileri</li>
            <li>• Benzer film önerileri</li>
            <li>• Keşfedilmeyi bekleyen filmler</li>
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/60 p-6">
          <div className="mb-5 flex items-center gap-4">
            <Film className="h-8 w-8 shrink-0 text-cyan-400" />
            <h2 className="text-xl font-semibold text-white">
              Veriler Nereden Geliyor?
            </h2>
          </div>

          <p className="leading-8 text-zinc-300">
            Film afişleri, oyuncular, yönetmenler, özetler ve teknik bilgiler
            TMDB, IMDb ve OMDb gibi kaynaklardan derlenmektedir. Fragmanlar Youtube'dan alınmaktadır.
          </p>

          <p className="mt-5 leading-8 text-zinc-300">
            Kişisel puanlar, favoriler ve oluşturduğum listeler ise tamamen kendi IMDb arşivimden alınmıştır.
          </p>
        </div>
      </section>

      {/* Story */}

      <section className="mt-12 rounded-3xl border border-white/10 bg-zinc-900/40 p-8">
        <h2 className="mb-6 text-3xl font-bold text-white">
          Kişisel Bir Sinema Günlüğü
        </h2>

        <div className="space-y-6 text-zinc-300">
          <p>
            İzlediklerim bir film veritabanı olmaktan çok, yıllar boyunca
            oluşturduğum kişisel sinema geçmişini saklayan dijital bir günlük.
          </p>

          <p>
            Burada yer alan her puan, her favori ve her liste zaman içinde
            oluşmuş gerçek izleme alışkanlıklarımı yansıtıyor.
          </p>

          <p>
            Amacım yalnızca film listelemek değil; yıllar sonra dönüp
            baktığımda hangi filmi ne zaman izlediğimi, nasıl değerlendirdiğimi
            ve sinema zevkimin nasıl değiştiğini görebileceğim kalıcı bir arşiv
            oluşturmak.
          </p>

          <p>
            Site sürekli geliştiriliyor. Yeni özellikler eklenmeye ve koleksiyon
            büyümeye devam ediyor.
          </p>
        </div>

        <h3 className="mb-3 mt-10 text-2xl font-semibold text-white">
          İletişim
        </h3>
        <div className="space-y-3 text-zinc-300">
          <p>
            Her türlü görüş, öneri veya geri bildiriminiz için bana <a href="https://wolkanca.com" className="text-red-500">wolkanca.com</a> üzerinden ulaşabilirsiniz.
          </p>

        </div>
      </section>

      {/* Footer */}

      <section className="mt-12 rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <h2 className="mb-4 text-2xl font-bold text-white">
          İyi Seyirler 🍿
        </h2>

        <p className="mx-auto mb-8 max-w-2xl leading-8 text-zinc-300">
          Umarım bu kişisel arşiv sayesinde yeni filmler keşfeder, benzer
          yapımlara ulaşır ve sinema dünyasında keyifli vakit geçirirsiniz.
        </p>

        <Link
          href="/movies"
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-medium text-white transition hover:bg-red-500"
        >
          Filmleri Keşfet
          <ArrowRight size={18} />
        </Link>
      </section>
    </main>
  );
}