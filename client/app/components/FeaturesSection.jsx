import { Sparkles, Shield, Globe, Zap, ArrowRight } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Powered Parsing",
      description: "Natural language processing converts your requests into structured cross-chain actions using Google Gemini.",
      color: "from-purple-500 to-blue-500"
    },
    {
      icon: Shield,
      title: "Secure Execution",
      description: "All transactions are executed through ZetaChain's secure cross-chain infrastructure with real-time monitoring.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Globe,
      title: "Multi-Chain Support",
      description: "Execute actions across Ethereum, Polygon, BSC, and other EVM-compatible chains seamlessly.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Instant Results",
      description: "Real-time transaction tracking and immediate feedback on cross-chain operations.",
      color: "from-yellow-500 to-orange-500"
    }
  ];

  return (
    <div id="features" className="max-w-6xl mx-auto px-6 lg:px-8 py-20">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-white mb-4">Powered by ZetaChain</h2>
        <p className="text-xl text-gray-300">Seamless cross-chain execution with AI intelligence</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-all group">
            <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* CTA Section */}
      <div className="text-center mt-16">
        <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-white mb-4">Ready to Get Started?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Connect your wallet and start executing cross-chain strategies with natural language commands.
          </p>
          <button className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-6 py-3 rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all">
            <span>Start Building</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
} 