import { Head, Link } from "@inertiajs/react";
import { ArrowLeft, Star, Check, Lock, TrendingUp, BarChart3, Globe } from "lucide-react";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";

function PremiumFeatureCard({ icon: Icon, title, description, isUnlocked = false }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 relative">
      {!isUnlocked && (
        <div className="absolute top-2 right-2">
          <Lock className="w-4 h-4 text-slate-500" />
        </div>
      )}
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-6 h-6 ${isUnlocked ? 'text-yellow-400' : 'text-slate-500'}`} />
        <h3 className={`font-semibold ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
          {title}
        </h3>
      </div>
      <p className={`text-sm ${isUnlocked ? 'text-slate-300' : 'text-slate-500'}`}>
        {description}
      </p>
      {isUnlocked && (
        <div className="mt-2 flex items-center gap-1 text-green-400 text-xs">
          <Check className="w-3 h-3" />
          <span>Unlocked</span>
        </div>
      )}
    </div>
  );
}

function BlockDagLogo({ className }) {
  return (
    <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 0L100 25V75L50 100L0 75V25L50 0Z" fill="url(#paint0_linear_101_2)" />
      <defs>
        <linearGradient id="paint0_linear_101_2" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop stopColor="#00F2FF" />
          <stop offset="1" stopColor="#8727FF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Premium({ auth, userStakeLevel = 0, unlockedForecasts = [] }) {
  // Determine user's access level based on stake
  const hasBasicAccess = userStakeLevel >= 50;
  const hasFullAccess = userStakeLevel >= 100;

  return (
    <AuthenticatedLayout user={auth.user}>
      <Head title="Premium Features" />
      
      <div className="min-h-screen bg-gradient-to-br from-[#1E203B] to-slate-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <header className="flex items-center gap-4 mb-8">
            <Link href={route("dashboard")} className="p-2 rounded-full hover:bg-white/10">
              <ArrowLeft size={24} />
            </Link>
            <div>
              <h1 className="text-4xl font-bold">Premium Access</h1>
              <p className="text-slate-400 mt-1">
                Your current access level: {
                  hasFullAccess ? "Full Premium" : hasBasicAccess ? "Basic Premium" : "Free Tier"
                }
              </p>
            </div>
          </header>

          {/* Access Status */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-yellow-400">Your Premium Status</h2>
                <p className="text-slate-300 mt-2">
                  {userStakeLevel > 0 
                    ? `You have staked ${userStakeLevel} DAG tokens`
                    : "Stake DAG tokens to unlock premium features"
                  }
                </p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (hasFullAccess ? 5 : hasBasicAccess ? 3 : 1)
                          ? 'text-yellow-400 fill-yellow-400' 
                          : 'text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {hasFullAccess ? "Maximum Access" : hasBasicAccess ? "Premium Access" : "Basic Access"}
                </p>
              </div>
            </div>
          </div>

          {/* Premium Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <PremiumFeatureCard 
              icon={TrendingUp}
              title="Advanced Analytics"
              description="5-year historical trend analysis with AI-powered insights and confidence scores"
              isUnlocked={hasBasicAccess}
            />
            <PremiumFeatureCard 
              icon={BarChart3}
              title="Detailed Forecasts"
              description="Complete forecast breakdowns with methodology and key economic drivers"
              isUnlocked={hasBasicAccess}
            />
            <PremiumFeatureCard 
              icon={Globe}
              title="Multi-Country Access"
              description="Access forecasts for over 50+ countries with regional comparisons"
              isUnlocked={hasFullAccess}
            />
            <PremiumFeatureCard 
              icon={Star}
              title="Priority Updates"
              description="Get forecast updates 24 hours before free tier users"
              isUnlocked={hasFullAccess}
            />
            <PremiumFeatureCard 
              icon={Lock}
              title="Exclusive Reports"
              description="Monthly deep-dive economic reports and sector-specific analysis"
              isUnlocked={hasFullAccess}
            />
            <PremiumFeatureCard 
              icon={Check}
              title="API Access"
              description="Direct API access to integrate forecasts into your applications"
              isUnlocked={hasFullAccess}
            />
          </div>

          {/* Unlocked Forecasts */}
          {unlockedForecasts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Your Unlocked Forecasts</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {unlockedForecasts.map((forecast) => (
                  <Link 
                    key={forecast.id}
                    href={route('forecasts.show', forecast.id)}
                    className="bg-slate-800/50 border border-slate-700 hover:border-yellow-400/50 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{forecast.title}</h3>
                      <Check className="w-4 h-4 text-green-400" />
                    </div>
                    <p className="text-slate-400 text-sm">{forecast.country}</p>
                    <p className="text-yellow-400 text-lg font-bold mt-2">{forecast.freeSummary}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade Section */}
          {!hasFullAccess && (
            <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 border border-yellow-400/30 rounded-lg p-6 text-center">
              <h2 className="text-2xl font-bold mb-2">Ready to Upgrade?</h2>
              <p className="text-slate-300 mb-6">
                {!hasBasicAccess 
                  ? "Stake 50 DAG tokens for basic premium access or 100 tokens for full premium access"
                  : "Stake 100 DAG tokens for full premium access with exclusive features"
                }
              </p>
              <Link 
                href={route("dashboard")} 
                className="inline-flex items-center gap-2 bg-yellow-400 text-slate-900 font-bold py-3 px-6 rounded-lg hover:bg-yellow-300 transition-colors"
              >
                <Star className="w-5 h-5" />
                {!hasBasicAccess ? "Unlock Premium Features" : "Upgrade to Full Access"}
              </Link>
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center">
            <div className="border border-slate-600 rounded-lg py-4 flex items-center justify-center gap-3">
              <span className="text-slate-400">Secured on</span>
              <BlockDagLogo className="w-6 h-6" />
              <span className="font-bold">BlockDAG</span>
            </div>
          </footer>
        </div>
      </div>
    </AuthenticatedLayout>
  );
}