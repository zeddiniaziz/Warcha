"use client";
import { useEffect, useState } from "react";
import { supabase } from "../supabase-client";
import type React from "react";
import {
  Wrench,
  Users,
  Package,
  FileText,
  Settings,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
  Star,
  Menu,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Custom Button Component
const Button = ({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";

  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 bg-transparent hover:bg-gray-50",
    ghost: "hover:bg-gray-100",
  };

  const sizes = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Card Components
const Card = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div
    className={`rounded-lg border bg-white shadow-sm ${className}`}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>
    {children}
  </div>
);

const CardTitle = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <h3
    className={`text-2xl font-semibold leading-none tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>
    {children}
  </p>
);

const CardContent = ({
  children,
  className = "",
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

// Custom Input Component
const Input = ({
  className = "",
  ...props
}: {
  className?: string;
  [key: string]: any;
}) => (
  <input
    className={`flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    {...props}
  />
);

// Custom Badge Component
const Badge = ({
  children,
  variant = "default",
  className = "",
  ...props
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary";
  className?: string;
  [key: string]: any;
}) => {
  const variants = {
    default: "bg-blue-600 text-white",
    secondary: "bg-gray-100 text-gray-900",
  };

  return (
    <div
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// Custom Link Component (for regular anchor tags)
const Link = ({
  href,
  children,
  className = "",
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => (
  <a href={href} className={className} {...props}>
    {children}
  </a>
);

// Custom Image Component
const Image = ({
  src,
  alt,
  width,
  height,
  className = "",
  ...props
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  [key: string]: any;
}) => (
  <img
    src={src || "/placeholder.svg"}
    alt={alt}
    width={width}
    height={height}
    className={className}
    {...props}
  />
);

export default function landingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [abonnements, setAbonnements] = useState<any[]>([]);
  const [loadingAbos, setLoadingAbos] = useState(true);

  useEffect(() => {
    const fetchAbonnements = async () => {
      setLoadingAbos(true);
      const { data, error } = await supabase
        .from("abonnements")
        .select("*")
        .order("prix", { ascending: true });
      if (!error) setAbonnements(data || []);
      setLoadingAbos(false);
    };
    fetchAbonnements();
  }, []);
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto">
          <div className="flex items-center space-x-2">
            <Wrench className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">Warcha</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="#fonctionnalites"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Fonctionnalités
            </Link>
            <Link
              href="#avantages"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Avantages
            </Link>
            <Link
              href="#tarifs"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Tarifs
            </Link>
            <Link
              href="#contact"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/login")}
            >
              Connexion
            </Button>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              Essai gratuit
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="container px-4 py-4 space-y-4 mx-auto">
              <Link
                href="#fonctionnalites"
                className="block text-sm font-medium text-gray-600"
              >
                Fonctionnalités
              </Link>
              <Link
                href="#avantages"
                className="block text-sm font-medium text-gray-600"
              >
                Avantages
              </Link>
              <Link
                href="#tarifs"
                className="block text-sm font-medium text-gray-600"
              >
                Tarifs
              </Link>
              <Link
                href="#contact"
                className="block text-sm font-medium text-gray-600"
              >
                Contact
              </Link>
              <div className="flex flex-col space-y-2 pt-4">
                <Button variant="ghost" size="sm">
                  Connexion
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Essai gratuit
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100" />
          <div className="relative container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                  >
                    🚀 Nouveau : Tableau de bord avancé
                  </Badge>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                    Gérez votre atelier de réparation en toute{" "}
                    <span className="text-blue-600">simplicité</span>
                  </h1>
                  <p className="text-xl text-gray-600 leading-relaxed">
                    Warcha est la solution complète pour digitaliser et
                    optimiser la gestion de votre atelier. Clients, stock,
                    techniciens, réparations - tout en un seul endroit.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
                  >
                    Commencer gratuitement
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="text-lg px-8 py-3 bg-transparent"
                  >
                    Voir la démo
                  </Button>
                </div>

                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>14 jours gratuits</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Sans engagement</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Support français</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="relative z-10">
                  <Image
                    src="/placeholder.svg?height=600&width=800"
                    alt="Interface Warcha - Tableau de bord"
                    width={800}
                    height={600}
                    className="rounded-2xl shadow-2xl"
                  />
                </div>
                <div className="absolute -top-4 -right-4 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
                <div className="absolute -bottom-8 -left-4 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="fonctionnalites" className="py-20 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
                Toutes les fonctionnalités dont vous avez besoin
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Une suite complète d'outils pour gérer efficacement votre
                atelier de réparation, de la prise de commande à la facturation.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wrench className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Gestion des Ateliers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Organisez et supervisez plusieurs ateliers depuis une
                    interface unique. Suivez les performances et optimisez vos
                    opérations.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">Gestion du Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Suivez vos pièces détachées en temps réel. Alertes de stock
                    bas, commandes automatiques et gestion des fournisseurs.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Fiches de Réparation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Créez et suivez les fiches de réparation. Historique
                    complet, photos, diagnostics et suivi du statut en temps
                    réel.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-orange-600" />
                  </div>
                  <CardTitle className="text-xl">Gestion des Clients</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Base de données clients complète avec historique des
                    réparations, préférences et système de fidélisation intégré.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Settings className="h-8 w-8 text-red-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Gestion des Techniciens
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Planifiez les interventions, suivez les performances et
                    gérez les compétences de votre équipe technique.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-teal-600" />
                  </div>
                  <CardTitle className="text-xl">
                    Rapports & Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center text-gray-600">
                    Tableaux de bord détaillés, rapports financiers et analyses
                    de performance pour optimiser votre activité.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section id="avantages" className="py-20 bg-gray-50">
          <div className="container px-4 mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
                    Pourquoi choisir Warcha ?
                  </h2>
                  <p className="text-xl text-gray-600">
                    Rejoignez plus de 500 ateliers qui ont déjà transformé leur
                    activité avec notre solution tout-en-un.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Gain de temps de 40%
                      </h3>
                      <p className="text-gray-600">
                        Automatisez vos tâches répétitives et concentrez-vous
                        sur ce qui compte vraiment : la satisfaction de vos
                        clients.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Sécurité garantie
                      </h3>
                      <p className="text-gray-600">
                        Vos données sont protégées par un chiffrement de niveau
                        bancaire. Sauvegardes automatiques et conformité RGPD.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        Augmentation du CA de 25%
                      </h3>
                      <p className="text-gray-600">
                        Optimisez vos processus, réduisez les erreurs et
                        améliorez la satisfaction client pour booster votre
                        chiffre d'affaires.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <Image
                  src="/placeholder.svg?height=500&width=600"
                  alt="Atelier de réparation professionnel"
                  width={600}
                  height={500}
                  className="rounded-2xl shadow-2xl"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-white">
          <div className="container px-4 mx-auto">
            <div className="text-center space-y-4 mb-16">
              <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">
                Ils nous font confiance
              </h2>
              <p className="text-xl text-gray-600">
                Découvrez ce que nos clients disent d'Warcha
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">
                    "Warcha a révolutionné notre façon de travailler. Nous avons
                    gagné énormément de temps sur la gestion administrative."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-blue-600 font-semibold">MR</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Marc Rousseau
                      </p>
                      <p className="text-sm text-gray-600">
                        Atelier Moto Expert, Lyon
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">
                    "Interface intuitive et support client exceptionnel. Je
                    recommande vivement Warcha à tous les professionnels."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-green-600 font-semibold">SD</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        Sophie Dubois
                      </p>
                      <p className="text-sm text-gray-600">
                        Réparation Express, Paris
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6">
                    "Depuis que nous utilisons Warcha, notre productivité a
                    augmenté de 30% et nos clients sont plus satisfaits."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-purple-600 font-semibold">JM</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Jean Martin</p>
                      <p className="text-sm text-gray-600">
                        TechService Pro, Marseille
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="tarifs" className="py-20 bg-gray-50">
  <div className="container px-4 mx-auto">
    <div className="text-center space-y-4 mb-16">
      <h2 className="text-3xl lg:text-5xl font-bold text-gray-900">Tarifs transparents</h2>
      <p className="text-xl text-gray-600">Choisissez le plan qui correspond à la taille de votre atelier</p>
    </div>

    {loadingAbos ? (
      <div className="text-center text-gray-500 py-12">Chargement des abonnements...</div>
    ) : (
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {abonnements.map((abo, idx) => (
          <Card
            key={abo.id}
            className={
              `border-2 transition-colors ` +
              (idx === 1
                ? "border-blue-500 relative hover:border-blue-600"
                : idx === abonnements.length - 1
                ? "border-gray-200 hover:border-purple-300"
                : "border-gray-200 hover:border-blue-300")
            }
          >
            {idx === 1 && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">Le plus populaire</Badge>
              </div>
            )}
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-2xl font-bold">{abo.nom}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {abo.prix && abo.prix > 0 ? `${abo.prix}€` : "Sur mesure"}
                </span>
                {abo.prix && abo.prix > 0 && <span className="text-gray-600">/mois</span>}
              </div>
              <CardDescription className="mt-2">
                {abo.nom === "Starter"
                  ? "Parfait pour les petits ateliers"
                  : abo.nom === "Professional"
                  ? "Idéal pour les ateliers en croissance"
                  : "Pour les grandes entreprises"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {(abo.features || "")
                  .split("__")
                  .filter((f: string) => f.trim().length > 0)
                  .map((feature: string, i: number) => (
                    <div className="flex items-center" key={i}>
                      <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </div>
                  ))}
              </div>
              <Button
                className={`w-full mt-8 ${
                  idx === 1
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-transparent"
                }`}
                variant={idx === 1 ? "default" : "outline"}
              >
                {abo.prix && abo.prix > 0 ? "Commencer l'essai gratuit" : "Nous contacter"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    )}
  </div>
</section>

        {/* CTA Section */}
        <section className="py-20 bg-blue-600">
          <div className="container px-4 mx-auto text-center">
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-3xl lg:text-5xl font-bold text-white">
                Prêt à transformer votre atelier ?
              </h2>
              <p className="text-xl text-blue-100">
                Rejoignez des centaines d'ateliers qui ont déjà fait le choix
                d'Warcha. Commencez votre essai gratuit de 14 jours dès
                aujourd'hui.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <div className="flex flex-col sm:flex-row gap-4 max-w-md w-full">
                  <Input
                    type="email"
                    placeholder="Votre adresse email"
                    className="bg-white border-0 text-gray-900 placeholder-gray-500"
                  />
                  <Button
                    size="lg"
                    className="bg-white text-black hover:bg-gray-100 whitespace-nowrap"
                  >
                    Commencer gratuitement
                  </Button>
                </div>
              </div>

              <p className="text-sm text-blue-200">
                Aucune carte bancaire requise • Annulation à tout moment •
                Support en français
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="container px-4 mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Wrench className="h-8 w-8 text-blue-400" />
                <span className="text-xl font-bold">Warcha</span>
              </div>
              <p className="text-gray-400">
                La solution complète pour gérer votre atelier de réparation avec
                efficacité et professionnalisme.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Fonctionnalités
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Tarifs
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Sécurité
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Centre d'aide
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Formation
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Entreprise</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    À propos
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Carrières
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Partenaires
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Warcha. Tous droits réservés.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Mentions légales
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Confidentialité
              </Link>
              <Link
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                CGU
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
