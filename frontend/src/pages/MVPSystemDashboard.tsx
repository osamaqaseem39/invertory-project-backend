import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTranslation } from '../i18n/i18nContext';
import { 
  Plus, 
  Users, 
  Database, 
  CreditCard, 
  Key,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Globe,
  Smartphone
} from 'lucide-react';

interface ClientOnboardingData {
  client_name: string;
  contact_email: string;
  contact_phone?: string;
  company_name?: string;
  country?: string;
  timezone?: string;
  device_fingerprint: string;
  hardware_signature: string;
}

interface OnboardingStatistics {
  totalClients: number;
  activeClients: number;
  trialClients: number;
  licensedClients: number;
  suspendedClients: number;
  newClientsThisMonth: number;
  newClientsThisWeek: number;
}

interface LicensePricing {
  [key: string]: {
    credits: number;
    duration: number;
    price: number;
  };
}

const MVPSystemDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [statistics, setStatistics] = useState<OnboardingStatistics | null>(null);
  const [licensePricing, setLicensePricing] = useState<LicensePricing>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboardForm, setShowOnboardForm] = useState(false);
  const [onboardingData, setOnboardingData] = useState<ClientOnboardingData>({
    client_name: '',
    contact_email: '',
    contact_phone: '',
    company_name: '',
    country: '',
    timezone: '',
    device_fingerprint: '',
    hardware_signature: ''
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch onboarding statistics
      const statsResponse = await fetch('/api/v1/mvp-system/onboarding-statistics', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.data);
      }

      // Fetch license pricing
      const pricingResponse = await fetch('/api/v1/mvp-system/license-pricing', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (pricingResponse.ok) {
        const pricingData = await pricingResponse.json();
        setLicensePricing(pricingData.data);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/v1/mvp-system/onboard-client', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(onboardingData)
      });

      if (!response.ok) {
        throw new Error('Failed to onboard client');
      }

      const result = await response.json();
      alert(`Client onboarded successfully! Client ID: ${result.data.clientId}`);
      
      // Reset form
      setOnboardingData({
        client_name: '',
        contact_email: '',
        contact_phone: '',
        company_name: '',
        country: '',
        timezone: '',
        device_fingerprint: '',
        hardware_signature: ''
      });
      setShowOnboardForm(false);
      
      // Refresh data
      fetchDashboardData();

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to onboard client');
    }
  };

  const generateDeviceFingerprint = () => {
    const fingerprint = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setOnboardingData({ ...onboardingData, device_fingerprint: fingerprint });
  };

  const generateHardwareSignature = () => {
    const signature = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setOnboardingData({ ...onboardingData, hardware_signature: signature });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">MVP System Dashboard</h1>
          <p className="text-gray-600">Complete multi-client POS distribution system</p>
        </div>
        <Button onClick={() => setShowOnboardForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Onboard New Client
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.totalClients}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.newClientsThisWeek} this week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{statistics.activeClients}</div>
              <p className="text-xs text-muted-foreground">
                {statistics.licensedClients} licensed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Trial Clients</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{statistics.trialClients}</div>
              <p className="text-xs text-muted-foreground">
                50 credits each
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{statistics.suspendedClients}</div>
              <p className="text-xs text-muted-foreground">
                Need attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="onboarding">Client Onboarding</TabsTrigger>
          <TabsTrigger value="licenses">License Management</TabsTrigger>
          <TabsTrigger value="trial">Trial System</TabsTrigger>
          <TabsTrigger value="databases">Database Management</TabsTrigger>
        </TabsList>

        {/* System Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>System Architecture</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Master Server (France)</div>
                      <div className="text-sm text-gray-600">Central control panel</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Database className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Separate Database per Client</div>
                      <div className="text-sm text-gray-600">Complete data isolation</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="font-medium">Desktop Apps Worldwide</div>
                      <div className="text-sm text-gray-600">Offline-first design</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-orange-600" />
                    <div>
                      <div className="font-medium">License Activation</div>
                      <div className="text-sm text-gray-600">Email/Phone based</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div className="text-sm">Install App → Guest Screen</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div className="text-sm">Use POS → Credits Consumed</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div className="text-sm">Credits End → System Locks</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div className="text-sm">Contact Admin → License Generated</div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">5</div>
                    <div className="text-sm">Enter License → System Activates</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Client Onboarding Tab */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Client Onboarding Process</CardTitle>
            </CardHeader>
            <CardContent>
              {showOnboardForm ? (
                <form onSubmit={handleOnboardClient} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client_name">{t.customers.customer} *</Label>
                      <Input
                        id="client_name"
                        value={onboardingData.client_name}
                        onChange={(e) => setOnboardingData({...onboardingData, client_name: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_email">{t.customers.email} *</Label>
                      <Input
                        id="contact_email"
                        type="email"
                        value={onboardingData.contact_email}
                        onChange={(e) => setOnboardingData({...onboardingData, contact_email: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="contact_phone">{t.customers.phone}</Label>
                      <Input
                        id="contact_phone"
                        value={onboardingData.contact_phone}
                        onChange={(e) => setOnboardingData({...onboardingData, contact_phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company_name">{t.customers.companyName}</Label>
                      <Input
                        id="company_name"
                        value={onboardingData.company_name}
                        onChange={(e) => setOnboardingData({...onboardingData, company_name: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">{t.customers.country}</Label>
                      <Input
                        id="country"
                        value={onboardingData.country}
                        onChange={(e) => setOnboardingData({...onboardingData, country: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={onboardingData.timezone}
                        onChange={(e) => setOnboardingData({...onboardingData, timezone: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="device_fingerprint">Device Fingerprint *</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="device_fingerprint"
                          value={onboardingData.device_fingerprint}
                          onChange={(e) => setOnboardingData({...onboardingData, device_fingerprint: e.target.value})}
                          required
                        />
                        <Button type="button" variant="outline" onClick={generateDeviceFingerprint}>
                          Generate
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="hardware_signature">Hardware Signature *</Label>
                      <div className="flex space-x-2">
                        <Input
                          id="hardware_signature"
                          value={onboardingData.hardware_signature}
                          onChange={(e) => setOnboardingData({...onboardingData, hardware_signature: e.target.value})}
                          required
                        />
                        <Button type="button" variant="outline" onClick={generateHardwareSignature}>
                          Generate
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setShowOnboardForm(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Onboard Client</Button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Onboard New Client</h3>
                  <p className="text-gray-600 mb-4">Create a new client instance with separate database and trial session</p>
                  <Button onClick={() => setShowOnboardForm(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Start Onboarding
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* License Management Tab */}
        <TabsContent value="licenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>License Pricing & Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(licensePricing).map(([type, config]) => (
                    <div key={type} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                      <div className="text-center">
                        <h3 className="font-semibold text-lg">{type}</h3>
                        <div className="text-3xl font-bold text-blue-600 my-2">
                          {formatCurrency(config.price)}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>{config.credits.toLocaleString()} credits</div>
                          <div>{config.duration} month{config.duration > 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">License Activation Process</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>1. Client contacts master admin via email/phone</div>
                    <div>2. Master admin generates unique license key</div>
                    <div>3. License key sent to client via email/SMS</div>
                    <div>4. Client enters license key in their POS app</div>
                    <div>5. System activates with full features</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trial System Tab */}
        <TabsContent value="trial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trial System Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CreditCard className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">50</div>
                    <div className="text-sm text-green-600">Initial Credits</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Activity className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">1-10</div>
                    <div className="text-sm text-blue-600">Credits per Operation</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                    <div className="text-sm text-yellow-600">System Locks</div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Credit Consumption Rates</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Free Operations:</div>
                      <div className="text-gray-600">Product View, Product Search</div>
                    </div>
                    <div>
                      <div className="font-medium">1 Credit:</div>
                      <div className="text-gray-600">Sale Create, Product Update, Product Delete</div>
                    </div>
                    <div>
                      <div className="font-medium">2 Credits:</div>
                      <div className="text-gray-600">Product Create, Inventory Adjust</div>
                    </div>
                    <div>
                      <div className="font-medium">3-10 Credits:</div>
                      <div className="text-gray-600">Reports, User Management, System Settings</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Management Tab */}
        <TabsContent value="databases" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Isolation System</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Database Strategy</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-green-600" />
                        <span>Separate database per client</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-600" />
                        <span>Complete data isolation</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-purple-600" />
                        <span>Automatic backup & restore</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-orange-600" />
                        <span>Scalable architecture</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Database Naming Convention</h4>
                    <div className="space-y-2 text-sm">
                      <div className="font-mono bg-gray-100 p-2 rounded">
                        pos_client_{`{client_id}`}
                      </div>
                      <div className="text-gray-600">
                        Example: pos_client_565c55ab_df58_417e_9baa_d1b2b454335b
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Database Operations</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Database className="w-4 h-4 mr-2" />
                      List All Databases
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Activity className="w-4 h-4 mr-2" />
                      Database Health Check
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Usage Statistics
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Error Message */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-red-600">{error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MVPSystemDashboard;
