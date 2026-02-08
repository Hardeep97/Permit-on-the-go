"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Plus,
  Loader2,
  AlertCircle,
  Save,
  Trash2,
  Edit2,
  X,
  Upload,
  DollarSign,
  ExternalLink,
  Shield,
  FileText,
  Image as ImageIcon,
  Star,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VendorRating } from "@/components/vendors/VendorRating";
import {
  VENDOR_SPECIALTY_LABELS,
  VENDOR_SPECIALTIES,
  SUBCODE_LABELS,
  SUBCODE_TYPES,
  INSURANCE_TYPE_LABELS,
  INSURANCE_TYPES,
  TRANSACTION_STATUS_LABELS,
} from "@permits/shared";
import { cn } from "@/lib/utils";

type Tab = "profile" | "licenses" | "insurance" | "photos" | "reviews" | "payments";

interface VendorProfile {
  id: string;
  companyName: string;
  description: string | null;
  specialties: string[];
  serviceAreas: string[];
  website: string | null;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  logoUrl: string | null;
  stripeAccountId: string | null;
  stripeAccountStatus: string | null;
  user: {
    name: string;
    email: string;
    avatarUrl: string | null;
  };
  licenses: Array<{
    id: string;
    subcodeType: string;
    licenseNumber: string;
    state: string;
    issuedDate: string;
    expiryDate: string;
    isVerified: boolean;
    fileUrl: string | null;
  }>;
  insurance: Array<{
    id: string;
    type: string;
    provider: string;
    policyNumber: string;
    coverageAmount: number;
    expiryDate: string;
    fileUrl: string | null;
  }>;
  photos: Array<{
    id: string;
    fileUrl: string;
    caption: string | null;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    reviewer: {
      name: string;
      avatarUrl: string | null;
    };
  }>;
}

interface Transaction {
  id: string;
  amount: number;
  platformFee: number;
  status: string;
  description: string | null;
  createdAt: string;
}

export default function VendorPortalPage() {
  const [hasProfile, setHasProfile] = useState<boolean | null>(null);
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Registration form state
  const [companyName, setCompanyName] = useState("");
  const [description, setDescription] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([]);
  const [serviceAreaInput, setServiceAreaInput] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchVendorProfile();
  }, []);

  useEffect(() => {
    if (vendor && activeTab === "payments") {
      fetchTransactions();
    }
  }, [vendor, activeTab]);

  const fetchVendorProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/vendors/me");
      if (res.status === 404) {
        setHasProfile(false);
      } else if (res.ok) {
        const data: VendorProfile = await res.json();
        setVendor(data);
        setHasProfile(true);
        // Initialize form with existing data
        setCompanyName(data.companyName);
        setDescription(data.description || "");
        setSpecialties(data.specialties);
        setServiceAreas(data.serviceAreas);
        setWebsite(data.website || "");
      } else {
        throw new Error("Failed to load vendor profile");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    if (!vendor) return;
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          description,
          specialties,
          serviceAreas,
          website,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create vendor profile");
      }

      await fetchVendorProfile();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendor) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/vendors/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          description,
          specialties,
          serviceAreas,
          website,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update profile");
      }

      await fetchVendorProfile();
      alert("Profile updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSpecialty = (specialty: string) => {
    setSpecialties((prev) =>
      prev.includes(specialty)
        ? prev.filter((s) => s !== specialty)
        : [...prev, specialty]
    );
  };

  const addServiceArea = () => {
    if (serviceAreaInput.trim() && !serviceAreas.includes(serviceAreaInput.trim())) {
      setServiceAreas([...serviceAreas, serviceAreaInput.trim()]);
      setServiceAreaInput("");
    }
  };

  const removeServiceArea = (area: string) => {
    setServiceAreas(serviceAreas.filter((a) => a !== area));
  };

  const handleConnectStripe = async () => {
    if (!vendor) return;
    try {
      const res = await fetch(`/api/vendors/${vendor.id}/stripe`, {
        method: "POST",
      });

      if (!res.ok) {
        throw new Error("Failed to initiate Stripe connection");
      }

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error && hasProfile === null) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <AlertCircle className="mx-auto h-8 w-8 text-red-400" />
        <p className="mt-2 text-sm font-medium text-red-700">{error}</p>
      </div>
    );
  }

  // Registration form (no profile yet)
  if (!hasProfile) {
    return (
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Become a Vendor</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Join our marketplace and connect with property owners.
          </p>
        </div>

        <form onSubmit={handleRegister} className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm space-y-6">
          {/* Company name */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Company Name *
            </label>
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ABC Construction Inc."
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
              placeholder="Tell us about your business..."
            />
          </div>

          {/* Specialties */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Specialties
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VENDOR_SPECIALTIES.map((specialty) => (
                <label
                  key={specialty}
                  className="flex items-center gap-2 cursor-pointer rounded-lg border border-neutral-200 px-3 py-2 hover:border-primary-300"
                >
                  <input
                    type="checkbox"
                    checked={specialties.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                  />
                  <span className="text-sm text-neutral-700">
                    {VENDOR_SPECIALTY_LABELS[specialty]}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Service areas */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Service Areas
            </label>
            <div className="flex gap-2">
              <Input
                value={serviceAreaInput}
                onChange={(e) => setServiceAreaInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addServiceArea())}
                placeholder="Add city or region..."
              />
              <Button type="button" onClick={addServiceArea} variant="outline">
                Add
              </Button>
            </div>
            {serviceAreas.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                  >
                    {area}
                    <button
                      type="button"
                      onClick={() => removeServiceArea(area)}
                      className="text-neutral-500 hover:text-neutral-700"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Website
            </label>
            <Input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <Button type="submit" disabled={submitting || !companyName}>
            {submitting ? "Creating..." : "Create Vendor Profile"}
          </Button>
        </form>
      </div>
    );
  }

  // Management interface (has profile)
  if (!vendor) return null;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <Building2 className="h-4 w-4" /> },
    { id: "licenses", label: "Licenses", icon: <FileText className="h-4 w-4" /> },
    { id: "insurance", label: "Insurance", icon: <Shield className="h-4 w-4" /> },
    { id: "photos", label: "Photos", icon: <ImageIcon className="h-4 w-4" /> },
    { id: "reviews", label: "Reviews", icon: <Star className="h-4 w-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Vendor Portal</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your vendor profile, licenses, and payments.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-neutral-200">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "border-primary-600 text-primary-600"
                  : "border-transparent text-neutral-600 hover:text-neutral-900"
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div>
        {/* Profile Tab */}
        {activeTab === "profile" && (
          <ProfileTab
            vendor={vendor}
            companyName={companyName}
            setCompanyName={setCompanyName}
            description={description}
            setDescription={setDescription}
            specialties={specialties}
            toggleSpecialty={toggleSpecialty}
            serviceAreas={serviceAreas}
            serviceAreaInput={serviceAreaInput}
            setServiceAreaInput={setServiceAreaInput}
            addServiceArea={addServiceArea}
            removeServiceArea={removeServiceArea}
            website={website}
            setWebsite={setWebsite}
            handleUpdateProfile={handleUpdateProfile}
            submitting={submitting}
            error={error}
          />
        )}

        {/* Licenses Tab */}
        {activeTab === "licenses" && (
          <LicensesTab vendor={vendor} onUpdate={fetchVendorProfile} />
        )}

        {/* Insurance Tab */}
        {activeTab === "insurance" && (
          <InsuranceTab vendor={vendor} onUpdate={fetchVendorProfile} />
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <PhotosTab vendor={vendor} onUpdate={fetchVendorProfile} />
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && <ReviewsTab vendor={vendor} />}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <PaymentsTab
            vendor={vendor}
            transactions={transactions}
            onConnectStripe={handleConnectStripe}
          />
        )}
      </div>
    </div>
  );
}

// Profile Tab Component
function ProfileTab({
  vendor,
  companyName,
  setCompanyName,
  description,
  setDescription,
  specialties,
  toggleSpecialty,
  serviceAreas,
  serviceAreaInput,
  setServiceAreaInput,
  addServiceArea,
  removeServiceArea,
  website,
  setWebsite,
  handleUpdateProfile,
  submitting,
  error,
}: any) {
  return (
    <form onSubmit={handleUpdateProfile} className="max-w-3xl space-y-6">
      <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Company Name *
          </label>
          <Input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Specialties
          </label>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {VENDOR_SPECIALTIES.map((specialty) => (
              <label
                key={specialty}
                className="flex items-center gap-2 cursor-pointer rounded-lg border border-neutral-200 px-3 py-2 hover:border-primary-300"
              >
                <input
                  type="checkbox"
                  checked={specialties.includes(specialty)}
                  onChange={() => toggleSpecialty(specialty)}
                  className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-2 focus:ring-primary-500/20"
                />
                <span className="text-sm text-neutral-700">
                  {VENDOR_SPECIALTY_LABELS[specialty]}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Service Areas
          </label>
          <div className="flex gap-2">
            <Input
              value={serviceAreaInput}
              onChange={(e) => setServiceAreaInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addServiceArea())}
              placeholder="Add city or region..."
            />
            <Button type="button" onClick={addServiceArea} variant="outline">
              Add
            </Button>
          </div>
          {serviceAreas.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {serviceAreas.map((area: string) => (
                <span
                  key={area}
                  className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-sm text-neutral-700"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeServiceArea(area)}
                    className="text-neutral-500 hover:text-neutral-700"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            Website
          </label>
          <Input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button type="submit" disabled={submitting}>
          <Save className="h-4 w-4" />
          {submitting ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}

// Licenses Tab Component
function LicensesTab({ vendor, onUpdate }: { vendor: VendorProfile; onUpdate: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [subcodeType, setSubcodeType] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [state, setState] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/vendors/${vendor.id}/licenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subcodeType,
          licenseNumber,
          state,
          issuedDate,
          expiryDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add license");
      }

      // Reset form
      setSubcodeType("");
      setLicenseNumber("");
      setState("");
      setIssuedDate("");
      setExpiryDate("");
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteLicense = async (licenseId: string) => {
    if (!confirm("Are you sure you want to delete this license?")) return;

    try {
      const res = await fetch(`/api/vendors/${vendor.id}/licenses/${licenseId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete license");
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Existing licenses */}
      {vendor.licenses.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {vendor.licenses.map((license) => (
            <div key={license.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary-600" />
                  <h3 className="font-semibold text-neutral-900">
                    {SUBCODE_LABELS[license.subcodeType as keyof typeof SUBCODE_LABELS]}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  {license.isVerified && <Shield className="h-4 w-4 text-green-600" />}
                  <button
                    onClick={() => handleDeleteLicense(license.id)}
                    className="text-neutral-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-neutral-600">
                  <span className="font-medium">License #:</span> {license.licenseNumber}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">State:</span> {license.state}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Expires:</span>{" "}
                  {new Date(license.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add license button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Add License
        </Button>
      )}

      {/* Add license form */}
      {showAddForm && (
        <form onSubmit={handleAddLicense} className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">Add License</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Trade Type *
            </label>
            <select
              value={subcodeType}
              onChange={(e) => setSubcodeType(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select a trade</option>
              {Object.entries(SUBCODE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              License Number *
            </label>
            <Input
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              State *
            </label>
            <Input
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="CA"
              maxLength={2}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Issued Date *
              </label>
              <Input
                type="date"
                value={issuedDate}
                onChange={(e) => setIssuedDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Expiry Date *
              </label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add License"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Insurance Tab Component
function InsuranceTab({ vendor, onUpdate }: { vendor: VendorProfile; onUpdate: () => void }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState("");
  const [provider, setProvider] = useState("");
  const [policyNumber, setPolicyNumber] = useState("");
  const [coverageAmount, setCoverageAmount] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/vendors/${vendor.id}/insurance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          provider,
          policyNumber,
          coverageAmount: Number(coverageAmount),
          expiryDate,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to add insurance");
      }

      // Reset form
      setType("");
      setProvider("");
      setPolicyNumber("");
      setCoverageAmount("");
      setExpiryDate("");
      setShowAddForm(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInsurance = async (insuranceId: string) => {
    if (!confirm("Are you sure you want to delete this insurance policy?")) return;

    try {
      const res = await fetch(`/api/vendors/${vendor.id}/insurance/${insuranceId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete insurance");
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Existing insurance */}
      {vendor.insurance.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {vendor.insurance.map((ins) => (
            <div key={ins.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-neutral-900">
                  {INSURANCE_TYPE_LABELS[ins.type as keyof typeof INSURANCE_TYPE_LABELS]}
                </h3>
                <button
                  onClick={() => handleDeleteInsurance(ins.id)}
                  className="text-neutral-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 space-y-1 text-sm">
                <p className="text-neutral-600">
                  <span className="font-medium">Provider:</span> {ins.provider}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Policy #:</span> {ins.policyNumber}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Coverage:</span> ${ins.coverageAmount.toLocaleString()}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">Expires:</span>{" "}
                  {new Date(ins.expiryDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add insurance button */}
      {!showAddForm && (
        <Button onClick={() => setShowAddForm(true)}>
          <Plus className="h-4 w-4" />
          Add Insurance
        </Button>
      )}

      {/* Add insurance form */}
      {showAddForm && (
        <form onSubmit={handleAddInsurance} className="rounded-lg border border-neutral-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-neutral-900">Add Insurance</h3>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-neutral-400 hover:text-neutral-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Insurance Type *
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              required
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            >
              <option value="">Select a type</option>
              {Object.entries(INSURANCE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Provider *
            </label>
            <Input
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Policy Number *
            </label>
            <Input
              value={policyNumber}
              onChange={(e) => setPolicyNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Coverage Amount ($) *
            </label>
            <Input
              type="number"
              value={coverageAmount}
              onChange={(e) => setCoverageAmount(e.target.value)}
              required
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Expiry Date *
            </label>
            <Input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Adding..." : "Add Insurance"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Photos Tab Component
function PhotosTab({ vendor, onUpdate }: { vendor: VendorProfile; onUpdate: () => void }) {
  const handleDeletePhoto = async (photoId: string) => {
    if (!confirm("Are you sure you want to delete this photo?")) return;

    try {
      const res = await fetch(`/api/vendors/${vendor.id}/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete photo");
      onUpdate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "An error occurred");
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {vendor.photos.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {vendor.photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
              <img
                src={photo.fileUrl}
                alt={photo.caption || "Portfolio image"}
                className="h-full w-full object-cover"
              />
              <button
                onClick={() => handleDeletePhoto(photo.id)}
                className="absolute top-2 right-2 rounded-full bg-white/90 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4 text-red-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
        <Upload className="mx-auto h-8 w-8 text-neutral-400" />
        <p className="mt-2 text-sm text-neutral-600">
          Photo upload functionality coming soon
        </p>
      </div>
    </div>
  );
}

// Reviews Tab Component
function ReviewsTab({ vendor }: { vendor: VendorProfile }) {
  if (vendor.reviews.length === 0) {
    return (
      <div className="max-w-3xl">
        <p className="text-sm text-neutral-500 italic">No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-4">
      {vendor.reviews.map((review) => (
        <div key={review.id} className="rounded-lg border border-neutral-200 bg-white p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-neutral-200 text-sm font-semibold text-neutral-700">
              {review.reviewer.avatarUrl ? (
                <img
                  src={review.reviewer.avatarUrl}
                  alt={review.reviewer.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                review.reviewer.name.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="font-semibold text-neutral-900">{review.reviewer.name}</p>
                <VendorRating rating={review.rating} size="sm" />
              </div>
              <p className="mt-1 text-xs text-neutral-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </p>
              {review.comment && (
                <p className="mt-2 text-sm text-neutral-700">{review.comment}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Payments Tab Component
function PaymentsTab({
  vendor,
  transactions,
  onConnectStripe,
}: {
  vendor: VendorProfile;
  transactions: Transaction[];
  onConnectStripe: () => void;
}) {
  const isConnected = vendor.stripeAccountStatus === "active";

  return (
    <div className="max-w-4xl space-y-6">
      {/* Stripe Connect status */}
      <div className="rounded-lg border border-neutral-200 bg-white p-6">
        <h3 className="font-semibold text-neutral-900 mb-4">Stripe Connect</h3>
        {!isConnected ? (
          <div>
            <p className="text-sm text-neutral-600 mb-4">
              Connect your Stripe account to receive payments from customers.
            </p>
            <Button onClick={onConnectStripe}>
              <CreditCard className="h-4 w-4" />
              Connect with Stripe
            </Button>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 text-green-600 mb-4">
              <Shield className="h-5 w-5" />
              <span className="font-medium">Connected</span>
            </div>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
            >
              View Stripe Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div>
        <h3 className="font-semibold text-neutral-900 mb-4">Transaction History</h3>
        {transactions.length === 0 ? (
          <p className="text-sm text-neutral-500 italic">No transactions yet.</p>
        ) : (
          <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-neutral-700">Date</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-700">Description</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-700">Amount</th>
                    <th className="px-4 py-3 text-right font-medium text-neutral-700">Platform Fee</th>
                    <th className="px-4 py-3 text-left font-medium text-neutral-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="border-b border-neutral-100">
                      <td className="px-4 py-3 text-neutral-600">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-neutral-900">
                        {txn.description || "Payment"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-neutral-900">
                        ${(txn.amount / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right text-neutral-600">
                        ${(txn.platformFee / 100).toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-xs font-medium",
                            txn.status === "COMPLETED" && "bg-green-100 text-green-700",
                            txn.status === "PENDING" && "bg-yellow-100 text-yellow-700",
                            txn.status === "FAILED" && "bg-red-100 text-red-700",
                            txn.status === "REFUNDED" && "bg-neutral-100 text-neutral-700"
                          )}
                        >
                          {TRANSACTION_STATUS_LABELS[txn.status as keyof typeof TRANSACTION_STATUS_LABELS] || txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
