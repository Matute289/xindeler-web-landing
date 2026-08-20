import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function LegalPage({ docKey }) {
    const { t } = useTranslation();
    const sections = t(`legal.${docKey}.sections`, { returnObjects: true });

    return (
        <div className="min-h-screen bg-x-dark">
            <div className="container mx-auto px-4 max-w-3xl py-16">
                <Link
                    to="/"
                    className="font-cinzel-dec text-2xl font-bold text-white hover:text-x-gold transition-colors"
                    style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
                >
                    XINDELER
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mt-10"
                >
                    <h1 className="font-cinzel text-2xl md:text-3xl tracking-wide text-white mb-2">
                        {t(`legal.${docKey}.title`)}
                    </h1>
                    <p className="text-xs text-gray-600 mb-6">{t('legal.lastUpdated')}</p>
                    <p className="text-sm text-gray-400 leading-relaxed mb-10">
                        {t(`legal.${docKey}.intro`)}
                    </p>

                    <div className="flex flex-col gap-8">
                        {sections.map((section, i) => (
                            <section key={i}>
                                <h2 className="font-cinzel text-sm tracking-widest uppercase text-x-gold mb-3">
                                    {section.heading}
                                </h2>
                                {section.body?.map((p, j) => (
                                    <p key={j} className="text-sm text-gray-300 leading-relaxed mb-3">
                                        {p}
                                    </p>
                                ))}
                                {section.list && (
                                    <ul className="list-disc list-outside pl-5 flex flex-col gap-2 mb-3">
                                        {section.list.map((item, j) => (
                                            <li key={j} className="text-sm text-gray-300 leading-relaxed">
                                                {item}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {section.footer?.map((p, j) => (
                                    <p key={`f${j}`} className="text-sm text-gray-300 leading-relaxed mb-3">
                                        {p}
                                    </p>
                                ))}
                            </section>
                        ))}
                    </div>

                    <Link
                        to="/"
                        className="inline-block mt-12 text-xs text-gray-600 hover:text-gray-400 transition-colors"
                    >
                        ← {t('legal.backHome')}
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
