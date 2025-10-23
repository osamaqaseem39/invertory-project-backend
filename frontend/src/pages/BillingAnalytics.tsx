import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  CreditCard, 
  BarChart3,
  FileText,
  Download,
  Plus,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';

interface BillingRecord {
  id: string;
  client_instance_id: string;
  billing_type: string;
  amount: number;
  description: string;
  payment_method?: string;
  status: string;
  paid_amount?: number;
  transaction_id?: string;
  due_date?: string;
  paid_at?: string;
  created_at: string;
  updated_at: string;
  client_instance?: {
    client_name: string;
    client_code: string;
    contact_email: string;
  };
}

interface PaymentRecord {
  id: string;
  billing_record_id: string;
  amount: number;
  payment_method: string;
  transaction_id: string;
  processed_at: string;
  billing_record: BillingRecord;
}

interface CreditPurchase {
  id: string;
  client_instance_id: string;
  credit_pack: string;
  credits_purchased: number;
  price_per_credit: number;
  total_cost: number;
  payment_method: string;
  status: string;
  created_at: string;
  client_instance?: {
    client_name: string;
    client_code: string;
    contact_email: string;
  };
}

interface BillingAnalytics {
  totalRevenue: number;
  pendingRevenue: number;
  paidByMethod: Array<{
    payment_method: string;
    _sum: { amount: number };
  }>;
  monthlyRevenue: { [key: string]: number };
}

const BillingAnalytics: React.FC = () => {
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [creditPurchases, setCreditPurchases] = useState<CreditPurchase[]>([]);
  const [analytics, setAnalytics] = useState<BillingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Fetch billing records
      const billingResponse = await fetch('/api/v1/billing-analytics/billing-records', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (billingResponse.ok) {
        const billingData = await billingResponse.json();
        setBillingRecords(billingData.data || []);
      }

      // Fetch payment records
      const paymentsResponse = await fetch('/api/v1/billing-analytics/payment-records', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setPaymentRecords(paymentsData.data || []);
      }

      // Fetch credit purchases
      const creditsResponse = await fetch('/api/v1/billing-analytics/credit-purchases', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        setCreditPurchases(creditsData.data || []);
      }

      // Fetch master dashboard analytics
      const analyticsResponse = await fetch('/api/v1/billing-analytics/master-dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.data.billing);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'PAID': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'PENDING': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'PARTIAL': { color: 'bg-blue-100 text-blue-800', icon: Clock },
      'OVERDUE': { color: 'bg-red-100 text-red-800', icon: AlertCircle },
      'CANCELLED': { color: 'bg-gray-100 text-gray-800', icon: AlertCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getBillingTypeColor = (type: string) => {
    const typeConfig = {
      'LICENSE_FEE': 'bg-blue-100 text-blue-800',
      'CREDIT_PURCHASE': 'bg-green-100 text-green-800',
      'SUBSCRIPTION': 'bg-purple-100 text-purple-800',
      'OTHER': 'bg-gray-100 text-gray-800',
    };

    return typeConfig[type as keyof typeof typeConfig] || typeConfig.OTHER;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Billing Data</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={fetchBillingData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Analytics</h1>
          <p className="text-gray-600">Manage billing records and analyze revenue</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Billing Record
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Revenue</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analytics?.pendingRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Records</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{billingRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              {billingRecords.filter(r => r.status === 'PAID').length} paid
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Credit Purchases</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{creditPurchases.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(creditPurchases.reduce((sum, p) => sum + p.total_cost, 0))} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="billing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="billing">Billing Records</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="credits">Credit Purchases</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Billing Records Tab */}
        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Billing Records</CardTitle>
            </CardHeader>
            <CardContent>
              {billingRecords.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Billing Records</h3>
                  <p className="text-gray-600">Create your first billing record to get started.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {billingRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className={getBillingTypeColor(record.billing_type)}>
                            {record.billing_type}
                          </Badge>
                          {getStatusBadge(record.status)}
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(record.amount)}</div>
                          {record.paid_amount && record.paid_amount > 0 && (
                            <div className="text-sm text-green-600">
                              Paid: {formatCurrency(record.paid_amount)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">{record.description}</div>
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <div>
                          {record.client_instance ? (
                            <span>{record.client_instance.client_name} ({record.client_instance.client_code})</span>
                          ) : (
                            <span>Client: {record.client_instance_id}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>Created: {formatDate(record.created_at)}</span>
                          {record.due_date && (
                            <span>Due: {formatDate(record.due_date)}</span>
                          )}
                          {record.paid_at && (
                            <span>Paid: {formatDate(record.paid_at)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Records</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentRecords.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payment Records</h3>
                  <p className="text-gray-600">No payments have been processed yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentRecords.map((payment) => (
                    <div key={payment.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">
                            {payment.payment_method}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            TXN: {payment.transaction_id}
                          </span>
                        </div>
                        <div className="font-semibold">{formatCurrency(payment.amount)}</div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        {payment.billing_record.description}
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <div>
                          {payment.billing_record.client_instance ? (
                            <span>{payment.billing_record.client_instance.client_name}</span>
                          ) : (
                            <span>Client: {payment.billing_record.client_instance_id}</span>
                          )}
                        </div>
                        <span>Processed: {formatDate(payment.processed_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Credit Purchases Tab */}
        <TabsContent value="credits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Credit Purchases</CardTitle>
            </CardHeader>
            <CardContent>
              {creditPurchases.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Credit Purchases</h3>
                  <p className="text-gray-600">No credit purchases have been made yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {creditPurchases.map((purchase) => (
                    <div key={purchase.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-blue-100 text-blue-800">
                            {purchase.credit_pack}
                          </Badge>
                          <Badge className={purchase.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                            {purchase.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(purchase.total_cost)}</div>
                          <div className="text-sm text-gray-600">
                            {purchase.credits_purchased.toLocaleString()} credits
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <div>
                          {purchase.client_instance ? (
                            <span>{purchase.client_instance.client_name} ({purchase.client_instance.client_code})</span>
                          ) : (
                            <span>Client: {purchase.client_instance_id}</span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4">
                          <span>{purchase.payment_method}</span>
                          <span>Created: {formatDate(purchase.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Payment Methods Breakdown */}
                {analytics?.paidByMethod && analytics.paidByMethod.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Revenue by Payment Method</h3>
                    <div className="space-y-2">
                      {analytics.paidByMethod.map((method) => (
                        <div key={method.payment_method} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{method.payment_method}</span>
                          <span className="font-semibold">{formatCurrency(method._sum.amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Monthly Revenue Trends */}
                {analytics?.monthlyRevenue && Object.keys(analytics.monthlyRevenue).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Monthly Revenue Trends</h3>
                    <div className="space-y-2">
                      {Object.entries(analytics.monthlyRevenue)
                        .sort(([a], [b]) => b.localeCompare(a))
                        .slice(0, 12)
                        .map(([month, revenue]) => (
                          <div key={month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{month}</span>
                            <span className="font-semibold">{formatCurrency(revenue)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <BarChart3 className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">{billingRecords.length}</div>
                    <div className="text-sm text-blue-600">Total Billing Records</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {billingRecords.filter(r => r.status === 'PAID').length}
                    </div>
                    <div className="text-sm text-green-600">Paid Records</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <Clock className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {billingRecords.filter(r => r.status === 'PENDING').length}
                    </div>
                    <div className="text-sm text-yellow-600">Pending Records</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BillingAnalytics;
