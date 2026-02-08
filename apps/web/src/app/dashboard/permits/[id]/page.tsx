"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  RefreshCw,
  Hash,
  Building2,
  Calendar,
  DollarSign,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Trash2,
  Pencil,
  ChevronDown,
  Upload,
  FileText,
  Camera,
  ClipboardCheck,
  Activity,
  Clock,
  Image,
  Share2,
  Download,
  Plus,
  User,
  MessageCircle,
  Send,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/permit/StatusBadge";
import { SubcodeBadge } from "@/components/permit/SubcodeBadge";
import { TimelineView } from "@/components/permit/TimelineView";
import {
  PERMIT_STATUS_LABELS,
  PERMIT_STATUS_TRANSITIONS,
  PROJECT_TYPE_LABELS,
  type PermitStatus,
  type ProjectType,
} from "@permits/shared";

// ---- Types ----
interface PermitDetail {
  id: string;
  title: string;
  permitNumber?: string;
  internalRef: string;
  description?: string;
  status: string;
  subcodeType: string;
  projectType: string;
  priority: string;
  estimatedValue?: number;
  permitFee?: number;
  submittedAt?: string;
  approvedAt?: string;
  issuedAt?: string;
  expiresAt?: string;
  notes?: string;
  createdAt: string;
  property?: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    blockLot?: string;
    propertyType: string;
  };
  jurisdiction?: {
    id: string;
    name: string;
    type: string;
    state: string;
    phone?: string;
    email?: string;
    permitPortalUrl?: string;
  };
  milestones?: Array<{
    id: string;
    title: string;
    description?: string;
    dueDate?: string;
    completedAt?: string;
    status: string;
    sortOrder: number;
  }>;
  inspections?: Array<{
    id: string;
    type: string;
    scheduledDate?: string;
    completedDate?: string;
    status: string;
    inspectorName?: string;
    result?: string;
    notes?: string;
  }>;
  _count?: {
    documents: number;
    photos: number;
    tasks: number;
    formSubmissions: number;
    messages: number;
  };
}

interface TimelineEvent {
  id: string;
  type: "milestone" | "inspection" | "status_change" | "document" | "photo" | "activity";
  title: string;
  description?: string;
  status?: string;
  date: string;
  metadata?: Record<string, unknown>;
}

interface DocumentItem {
  id: string;
  title: string;
  description?: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  category: string;
  createdAt: string;
  uploadedBy?: { id: string; name: string };
}

interface PhotoItem {
  id: string;
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  caption?: string;
  stage?: string;
  createdAt: string;
  uploadedBy?: { id: string; name: string };
  photoShares?: Array<{
    id: string;
    recipientEmail: string;
    recipientName?: string;
    sentAt?: string;
  }>;
}

interface InspectionItem {
  id: string;
  type: string;
  scheduledDate?: string;
  completedDate?: string;
  status: string;
  inspectorName?: string;
  result?: string;
  notes?: string;
}

interface ActivityItem {
  id: string;
  action: string;
  description: string;
  entityType: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface MessageItem {
  id: string;
  content: string;
  senderName: string;
  senderId: string;
  createdAt: string;
}

interface PartyItem {
  id: string;
  role: string;
  contact: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  userId?: string;
}

type TabId =
  | "overview"
  | "timeline"
  | "documents"
  | "photos"
  | "inspections"
  | "activity"
  | "messages"
  | "parties";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "photos", label: "Photos", icon: Image },
  { id: "inspections", label: "Inspections", icon: ClipboardCheck },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "messages", label: "Messages", icon: MessageCircle },
  { id: "parties", label: "Parties", icon: Users },
];

const PARTY_ROLES = [
  "OWNER",
  "EXPEDITOR",
  "CONTRACTOR",
  "ARCHITECT",
  "ENGINEER",
  "INSPECTOR",
  "VIEWER",
] as const;

const PARTY_ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  EXPEDITOR: "Expeditor",
  CONTRACTOR: "Contractor",
  ARCHITECT: "Architect",
  ENGINEER: "Engineer",
  INSPECTOR: "Inspector",
  VIEWER: "Viewer",
};

// ---- Helpers ----
function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCurrency(value: number | undefined): string {
  if (value == null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

function formatFileSize(bytes: number | undefined): string {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay > 30) return formatDate(dateStr);
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHr > 0) return `${diffHr}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return "Just now";
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

const inspectionStatusColors: Record<
  string,
  { bg: string; text: string }
> = {
  NOT_SCHEDULED: { bg: "bg-neutral-100", text: "text-neutral-700" },
  SCHEDULED: { bg: "bg-blue-50", text: "text-blue-700" },
  IN_PROGRESS: { bg: "bg-amber-50", text: "text-amber-700" },
  PASSED: { bg: "bg-green-50", text: "text-green-700" },
  FAILED: { bg: "bg-red-50", text: "text-red-700" },
  CANCELLED: { bg: "bg-neutral-100", text: "text-neutral-500" },
};

// ---- Main Component ----
export default function PermitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const permitId = params.id as string;

  const [permit, setPermit] = useState<PermitDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Tab data states
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [inspections, setInspections] = useState<InspectionItem[]>([]);
  const [inspectionsLoading, setInspectionsLoading] = useState(false);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Messages state
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Parties state
  const [parties, setParties] = useState<PartyItem[]>([]);
  const [partiesLoading, setPartiesLoading] = useState(false);
  const [showPartyForm, setShowPartyForm] = useState(false);
  const [partyFormRole, setPartyFormRole] = useState<string>("VIEWER");
  const [partyFormName, setPartyFormName] = useState("");
  const [partyFormEmail, setPartyFormEmail] = useState("");
  const [partyFormPhone, setPartyFormPhone] = useState("");
  const [partyFormCompany, setPartyFormCompany] = useState("");
  const [partyFormSubmitting, setPartyFormSubmitting] = useState(false);
  const [removingPartyId, setRemovingPartyId] = useState<string | null>(null);

  // Inspection form
  const [showInspectionForm, setShowInspectionForm] = useState(false);
  const [inspFormType, setInspFormType] = useState("");
  const [inspFormDate, setInspFormDate] = useState("");
  const [inspFormInspector, setInspFormInspector] = useState("");
  const [inspFormNotes, setInspFormNotes] = useState("");
  const [inspFormSubmitting, setInspFormSubmitting] = useState(false);

  // Photo lightbox
  const [lightboxPhoto, setLightboxPhoto] = useState<PhotoItem | null>(null);

  // ---- Fetch permit ----
  const fetchPermit = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/permits/${permitId}`);
      if (!res.ok) throw new Error("Failed to load permit");
      const json = await res.json();
      setPermit(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }, [permitId]);

  useEffect(() => {
    fetchPermit();
  }, [fetchPermit]);

  // Fetch current user ID for message alignment
  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        if (session?.user?.id) {
          setCurrentUserId(session.user.id);
        }
      })
      .catch(() => {});
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (activeTab === "messages") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // ---- Fetch tab data on tab change ----
  useEffect(() => {
    if (!permit) return;

    if (activeTab === "timeline" && timeline.length === 0 && !timelineLoading) {
      setTimelineLoading(true);
      fetch(`/api/permits/${permitId}/timeline`)
        .then((r) => r.json())
        .then((json) => setTimeline(json.data ?? []))
        .catch(() => {})
        .finally(() => setTimelineLoading(false));
    }

    if (activeTab === "documents" && documents.length === 0 && !documentsLoading) {
      setDocumentsLoading(true);
      fetch(`/api/permits/${permitId}/documents`)
        .then((r) => r.json())
        .then((json) => setDocuments(json.data ?? []))
        .catch(() => {})
        .finally(() => setDocumentsLoading(false));
    }

    if (activeTab === "photos" && photos.length === 0 && !photosLoading) {
      setPhotosLoading(true);
      fetch(`/api/permits/${permitId}/photos`)
        .then((r) => r.json())
        .then((json) => setPhotos(json.data ?? []))
        .catch(() => {})
        .finally(() => setPhotosLoading(false));
    }

    if (activeTab === "inspections" && inspections.length === 0 && !inspectionsLoading) {
      setInspectionsLoading(true);
      fetch(`/api/permits/${permitId}/inspections`)
        .then((r) => r.json())
        .then((json) => setInspections(json.data ?? []))
        .catch(() => {})
        .finally(() => setInspectionsLoading(false));
    }

    if (activeTab === "activity" && activities.length === 0 && !activitiesLoading) {
      setActivitiesLoading(true);
      fetch(`/api/permits/${permitId}/activity`)
        .then((r) => r.json())
        .then((json) => setActivities(json.data?.activities ?? []))
        .catch(() => {})
        .finally(() => setActivitiesLoading(false));
    }

    if (activeTab === "messages" && messages.length === 0 && !messagesLoading) {
      setMessagesLoading(true);
      fetch(`/api/permits/${permitId}/messages`)
        .then((r) => r.json())
        .then((json) => setMessages(json.data ?? []))
        .catch(() => {})
        .finally(() => setMessagesLoading(false));
    }

    if (activeTab === "parties" && parties.length === 0 && !partiesLoading) {
      setPartiesLoading(true);
      fetch(`/api/permits/${permitId}/parties`)
        .then((r) => r.json())
        .then((json) => setParties(json.data ?? []))
        .catch(() => {})
        .finally(() => setPartiesLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, permit, permitId]);

  // ---- Status update ----
  const handleStatusChange = async (newStatus: string) => {
    setUpdatingStatus(true);
    setShowStatusMenu(false);
    try {
      const res = await fetch(`/api/permits/${permitId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to update status");
      }
      await fetchPermit();
      // Reset tab data so they reload
      setTimeline([]);
      setActivities([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ---- Delete ----
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this permit? This action cannot be undone.")) {
      return;
    }
    setDeleting(true);
    try {
      const res = await fetch(`/api/permits/${permitId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to delete permit");
      }
      router.push("/dashboard/permits");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
      setDeleting(false);
    }
  };

  // ---- Document upload ----
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", file.name);
    formData.append("category", "OTHER");

    try {
      const res = await fetch(`/api/permits/${permitId}/documents`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setDocuments((prev) => [json.data, ...prev]);
    } catch {
      alert("Failed to upload document");
    }
    e.target.value = "";
  };

  // ---- Photo upload ----
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`/api/permits/${permitId}/photos`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setPhotos((prev) => [json.data, ...prev]);
    } catch {
      alert("Failed to upload photo");
    }
    e.target.value = "";
  };

  // ---- Schedule inspection ----
  const handleScheduleInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspFormType) return;
    setInspFormSubmitting(true);
    try {
      const body: Record<string, unknown> = { type: inspFormType };
      if (inspFormDate) body.scheduledDate = new Date(inspFormDate).toISOString();
      if (inspFormInspector) body.inspectorName = inspFormInspector;
      if (inspFormNotes) body.notes = inspFormNotes;

      const res = await fetch(`/api/permits/${permitId}/inspections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to schedule inspection");
      const json = await res.json();
      setInspections((prev) => [...prev, json.data]);
      setShowInspectionForm(false);
      setInspFormType("");
      setInspFormDate("");
      setInspFormInspector("");
      setInspFormNotes("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to schedule inspection");
    } finally {
      setInspFormSubmitting(false);
    }
  };

  // ---- Send message ----
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setSendingMessage(true);
    try {
      const res = await fetch(`/api/permits/${permitId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (!res.ok) throw new Error("Failed to send message");
      const json = await res.json();
      setMessages((prev) => [...prev, json.data]);
      setNewMessage("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  // ---- Add party ----
  const handleAddParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyFormName || !partyFormEmail) return;
    setPartyFormSubmitting(true);
    try {
      const res = await fetch(`/api/permits/${permitId}/parties`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: partyFormRole,
          contact: {
            name: partyFormName,
            email: partyFormEmail,
            phone: partyFormPhone || undefined,
            company: partyFormCompany || undefined,
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to add party");
      const json = await res.json();
      setParties((prev) => [...prev, json.data]);
      setShowPartyForm(false);
      setPartyFormRole("VIEWER");
      setPartyFormName("");
      setPartyFormEmail("");
      setPartyFormPhone("");
      setPartyFormCompany("");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to add party");
    } finally {
      setPartyFormSubmitting(false);
    }
  };

  // ---- Remove party ----
  const handleRemoveParty = async (partyId: string) => {
    if (!confirm("Remove this party from the permit?")) return;
    setRemovingPartyId(partyId);
    try {
      const res = await fetch(`/api/permits/${permitId}/parties/${partyId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove party");
      setParties((prev) => prev.filter((p) => p.id !== partyId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to remove party");
    } finally {
      setRemovingPartyId(null);
    }
  };

  // ---- Loading / Error states ----
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !permit) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
        <p className="mt-3 text-sm font-medium text-neutral-700">
          {error ?? "Permit not found"}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Button variant="outline" onClick={fetchPermit}>
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
          <Link href="/dashboard/permits">
            <Button variant="ghost">Back to Permits</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentStatus = permit.status as PermitStatus;
  const validTransitions =
    PERMIT_STATUS_TRANSITIONS[currentStatus] ?? [];
  const canDelete = ["DRAFT", "DENIED", "CLOSED", "EXPIRED"].includes(
    permit.status
  );

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link
            href="/dashboard/permits"
            className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-neutral-900">
              {permit.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {permit.permitNumber && (
                <span className="inline-flex items-center gap-1 rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                  <Hash className="h-3 w-3" />
                  {permit.permitNumber}
                </span>
              )}
              <StatusBadge status={permit.status} size="lg" />
              <SubcodeBadge subcodeType={permit.subcodeType} />
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Update Status dropdown */}
          {validTransitions.length > 0 && (
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatusMenu(!showStatusMenu)}
                disabled={updatingStatus}
              >
                {updatingStatus ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
                Update Status
              </Button>
              {showStatusMenu && (
                <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                  {validTransitions.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => handleStatusChange(nextStatus)}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                    >
                      <StatusBadge status={nextStatus} size="sm" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {canDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Delete
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-neutral-200 bg-white p-1 shadow-sm">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary-50 text-primary-700"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              <Icon
                className={`h-4 w-4 ${
                  activeTab === tab.id
                    ? "text-primary-600"
                    : "text-neutral-400"
                }`}
              />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {/* ========== OVERVIEW TAB ========== */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Left column - details */}
            <div className="space-y-6 lg:col-span-2">
              {/* Description */}
              {permit.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                      {permit.description}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Permit details */}
              <Card>
                <CardHeader>
                  <CardTitle>Permit Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Project Type
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-neutral-900">
                        {PROJECT_TYPE_LABELS[permit.projectType as ProjectType] ??
                          permit.projectType}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Priority
                      </dt>
                      <dd className="mt-1 text-sm font-medium text-neutral-900 capitalize">
                        {permit.priority.toLowerCase()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Estimated Value
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm font-medium text-neutral-900">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                        {formatCurrency(permit.estimatedValue)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Permit Fee
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm font-medium text-neutral-900">
                        <DollarSign className="h-3.5 w-3.5 text-neutral-400" />
                        {formatCurrency(permit.permitFee)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Created
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {formatDate(permit.createdAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Submitted
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {formatDate(permit.submittedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Approved
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {formatDate(permit.approvedAt)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Issued
                      </dt>
                      <dd className="mt-1 flex items-center gap-1 text-sm text-neutral-700">
                        <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                        {formatDate(permit.issuedAt)}
                      </dd>
                    </div>
                    {permit.expiresAt && (
                      <div>
                        <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                          Expires
                        </dt>
                        <dd className="mt-1 flex items-center gap-1 text-sm text-neutral-700">
                          <Calendar className="h-3.5 w-3.5 text-neutral-400" />
                          {formatDate(permit.expiresAt)}
                        </dd>
                      </div>
                    )}
                  </dl>
                  {permit.notes && (
                    <div className="mt-4 border-t border-neutral-100 pt-4">
                      <dt className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                        Notes
                      </dt>
                      <dd className="mt-1 text-sm text-neutral-600 whitespace-pre-wrap">
                        {permit.notes}
                      </dd>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column - property & jurisdiction */}
            <div className="space-y-6">
              {/* Property card */}
              {permit.property && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-neutral-400" />
                      Property
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Link
                      href={`/dashboard/properties/${permit.property.id}`}
                      className="block group"
                    >
                      <p className="text-sm font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                        {permit.property.name}
                      </p>
                      <div className="mt-1 flex items-start gap-1.5 text-sm text-neutral-500">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                        <span>
                          {permit.property.address}, {permit.property.city},{" "}
                          {permit.property.state} {permit.property.zipCode}
                        </span>
                      </div>
                    </Link>
                    {permit.property.blockLot && (
                      <p className="mt-2 text-xs text-neutral-400">
                        Block/Lot: {permit.property.blockLot}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Jurisdiction card */}
              {permit.jurisdiction && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-neutral-400" />
                      Jurisdiction
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      {permit.jurisdiction.name}
                    </p>
                    <p className="text-xs text-neutral-400 capitalize">
                      {permit.jurisdiction.type.toLowerCase()} - {permit.jurisdiction.state}
                    </p>
                    {permit.jurisdiction.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                        <Phone className="h-3.5 w-3.5 text-neutral-400" />
                        <a
                          href={`tel:${permit.jurisdiction.phone}`}
                          className="hover:text-primary-600"
                        >
                          {permit.jurisdiction.phone}
                        </a>
                      </div>
                    )}
                    {permit.jurisdiction.email && (
                      <div className="flex items-center gap-1.5 text-sm text-neutral-600">
                        <Mail className="h-3.5 w-3.5 text-neutral-400" />
                        <a
                          href={`mailto:${permit.jurisdiction.email}`}
                          className="hover:text-primary-600"
                        >
                          {permit.jurisdiction.email}
                        </a>
                      </div>
                    )}
                    {permit.jurisdiction.permitPortalUrl && (
                      <a
                        href={permit.jurisdiction.permitPortalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary-600 hover:underline"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Permit Portal
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-neutral-400" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Link
                    href={`/dashboard/permits/${permitId}/forms`}
                    className="flex items-center gap-2 rounded-lg border border-neutral-200 p-3 text-sm font-medium text-neutral-700 transition-colors hover:bg-primary-50 hover:border-primary-200 hover:text-primary-700"
                  >
                    <FileText className="h-4 w-4" />
                    Subcode Forms
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ========== TIMELINE TAB ========== */}
        {activeTab === "timeline" && (
          <Card>
            <CardHeader>
              <CardTitle>Permit Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : (
                <TimelineView events={timeline} />
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== DOCUMENTS TAB ========== */}
        {activeTab === "documents" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                Documents
              </h3>
              <label>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleDocUpload}
                />
                <span className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-8 px-3 border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900">
                    <Upload className="h-3 w-3" />
                    Upload Document
                </span>
              </label>
            </div>

            {documentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : documents.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    No documents uploaded yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-neutral-100">
                        <FileText className="h-5 w-5 text-neutral-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {doc.title}
                        </p>
                        <span className="inline-block mt-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600 capitalize">
                          {doc.category.toLowerCase().replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
                      <span>{formatFileSize(doc.fileSize)}</span>
                      <span>{formatDate(doc.createdAt)}</span>
                    </div>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:underline"
                    >
                      <Download className="h-3 w-3" />
                      Download
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========== PHOTOS TAB ========== */}
        {activeTab === "photos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                Photos
              </h3>
              <label>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <span className="cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-xs font-medium h-8 px-3 border border-neutral-300 bg-white text-neutral-700 shadow-sm hover:bg-neutral-50 hover:text-neutral-900">
                    <Camera className="h-3 w-3" />
                    Upload Photo
                </span>
              </label>
            </div>

            {photosLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : photos.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Image className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    No photos uploaded yet
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-all"
                  >
                    <div
                      className="aspect-square bg-neutral-100 cursor-pointer overflow-hidden"
                      onClick={() => setLightboxPhoto(photo)}
                    >
                      <img
                        src={photo.fileUrl}
                        alt={photo.caption || "Permit photo"}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div className="p-3">
                      {photo.caption && (
                        <p className="truncate text-sm font-medium text-neutral-900">
                          {photo.caption}
                        </p>
                      )}
                      {photo.stage && (
                        <span className="inline-block mt-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 capitalize">
                          {photo.stage.toLowerCase().replace(/_/g, " ")}
                        </span>
                      )}
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xs text-neutral-400">
                          {formatDate(photo.createdAt)}
                        </span>
                        <button
                          className="text-neutral-400 hover:text-primary-600 transition-colors"
                          title="Share"
                          onClick={async () => {
                            const email = prompt("Enter recipient email to share this photo:");
                            if (!email) return;
                            const name = prompt("Recipient name (optional):") || undefined;
                            try {
                              const res = await fetch(`/api/photos/${photo.id}/share`, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ recipientEmail: email, recipientName: name }),
                              });
                              if (!res.ok) throw new Error("Share failed");
                              alert("Photo shared successfully!");
                            } catch {
                              alert("Failed to share photo");
                            }
                          }}
                        >
                          <Share2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lightbox */}
            {lightboxPhoto && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
                onClick={() => setLightboxPhoto(null)}
              >
                <div
                  className="relative max-h-[90vh] max-w-[90vw]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={lightboxPhoto.fileUrl}
                    alt={lightboxPhoto.caption || "Photo"}
                    className="max-h-[85vh] rounded-lg object-contain"
                  />
                  {lightboxPhoto.caption && (
                    <p className="mt-2 text-center text-sm text-white">
                      {lightboxPhoto.caption}
                    </p>
                  )}
                  <button
                    onClick={() => setLightboxPhoto(null)}
                    className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-neutral-700 shadow-lg hover:bg-neutral-100"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== INSPECTIONS TAB ========== */}
        {activeTab === "inspections" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                Inspections
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInspectionForm(!showInspectionForm)}
              >
                <Plus className="h-3 w-3" />
                Schedule Inspection
              </Button>
            </div>

            {/* Inspection form */}
            {showInspectionForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule New Inspection</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={handleScheduleInspection}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Inspection Type *
                        </label>
                        <Input
                          value={inspFormType}
                          onChange={(e) => setInspFormType(e.target.value)}
                          placeholder="e.g., Foundation, Framing, Final"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Scheduled Date
                        </label>
                        <Input
                          type="datetime-local"
                          value={inspFormDate}
                          onChange={(e) => setInspFormDate(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Inspector Name
                        </label>
                        <Input
                          value={inspFormInspector}
                          onChange={(e) => setInspFormInspector(e.target.value)}
                          placeholder="Inspector name"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Notes
                        </label>
                        <Input
                          value={inspFormNotes}
                          onChange={(e) => setInspFormNotes(e.target.value)}
                          placeholder="Additional notes"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInspectionForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={inspFormSubmitting}
                      >
                        {inspFormSubmitting && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Schedule
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {inspectionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : inspections.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ClipboardCheck className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    No inspections scheduled
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {inspections.map((insp) => {
                  const statusColor =
                    inspectionStatusColors[insp.status] ??
                    inspectionStatusColors.NOT_SCHEDULED;
                  return (
                    <div
                      key={insp.id}
                      className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                            <ClipboardCheck className="h-4 w-4 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">
                              {insp.type}
                            </p>
                            {insp.inspectorName && (
                              <p className="text-xs text-neutral-500">
                                Inspector: {insp.inspectorName}
                              </p>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${statusColor.bg} ${statusColor.text}`}
                        >
                          {insp.status.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-neutral-400">
                        {insp.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Scheduled: {formatDate(insp.scheduledDate)}
                          </div>
                        )}
                        {insp.completedDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Completed: {formatDate(insp.completedDate)}
                          </div>
                        )}
                        {insp.result && (
                          <span
                            className={`font-medium ${
                              insp.result === "PASSED"
                                ? "text-green-600"
                                : insp.result === "FAILED"
                                  ? "text-red-600"
                                  : "text-neutral-500"
                            }`}
                          >
                            Result: {insp.result}
                          </span>
                        )}
                      </div>
                      {insp.notes && (
                        <p className="mt-2 text-xs text-neutral-500">
                          {insp.notes}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========== ACTIVITY TAB ========== */}
        {activeTab === "activity" && (
          <Card>
            <CardHeader>
              <CardTitle>Activity Feed</CardTitle>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                </div>
              ) : activities.length === 0 ? (
                <div className="py-12 text-center">
                  <Activity className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    No activity recorded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-start gap-3 border-b border-neutral-100 pb-4 last:border-b-0 last:pb-0"
                    >
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                        {act.user?.avatarUrl ? (
                          <img
                            src={act.user.avatarUrl}
                            alt={act.user.name}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          (act.user?.name?.[0] ?? "U").toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700">
                          <span className="font-medium text-neutral-900">
                            {act.user?.name ?? "System"}
                          </span>{" "}
                          {act.description}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-400">
                          {formatRelativeTime(act.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* ========== MESSAGES TAB ========== */}
        {activeTab === "messages" && (
          <Card className="flex flex-col" style={{ height: "calc(100vh - 320px)", minHeight: "400px" }}>
            <CardHeader className="flex-shrink-0">
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4 text-neutral-400" />
                Messages
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
              {/* Message thread */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {messagesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <MessageCircle className="h-10 w-10 text-neutral-300" />
                    <p className="mt-3 text-sm font-medium text-neutral-500">
                      No messages yet
                    </p>
                    <p className="mt-1 text-xs text-neutral-400">
                      Start the conversation by sending a message below
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwnMessage = msg.senderId === currentUserId;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isOwnMessage
                                ? "bg-primary-600 text-white"
                                : "bg-neutral-100 text-neutral-900"
                            }`}
                          >
                            {!isOwnMessage && (
                              <p
                                className={`text-xs font-semibold mb-1 ${
                                  isOwnMessage ? "text-primary-200" : "text-neutral-600"
                                }`}
                              >
                                {msg.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">
                              {msg.content}
                            </p>
                            <p
                              className={`mt-1 text-[10px] ${
                                isOwnMessage ? "text-primary-200" : "text-neutral-400"
                              }`}
                            >
                              {formatMessageTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message input */}
              <div className="flex-shrink-0 border-t border-neutral-200 px-6 py-4">
                <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1"
                    disabled={sendingMessage}
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={sendingMessage || !newMessage.trim()}
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Send
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ========== PARTIES TAB ========== */}
        {activeTab === "parties" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">
                Parties
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPartyForm(!showPartyForm)}
              >
                <UserPlus className="h-3 w-3" />
                Add Party
              </Button>
            </div>

            {/* Add party form */}
            {showPartyForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Party</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddParty} className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Role *
                        </label>
                        <select
                          value={partyFormRole}
                          onChange={(e) => setPartyFormRole(e.target.value)}
                          className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                        >
                          {PARTY_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {PARTY_ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Contact Name *
                        </label>
                        <Input
                          value={partyFormName}
                          onChange={(e) => setPartyFormName(e.target.value)}
                          placeholder="Full name"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Email *
                        </label>
                        <Input
                          type="email"
                          value={partyFormEmail}
                          onChange={(e) => setPartyFormEmail(e.target.value)}
                          placeholder="email@example.com"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Phone
                        </label>
                        <Input
                          type="tel"
                          value={partyFormPhone}
                          onChange={(e) => setPartyFormPhone(e.target.value)}
                          placeholder="(555) 555-5555"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium text-neutral-700 mb-1">
                          Company
                        </label>
                        <Input
                          value={partyFormCompany}
                          onChange={(e) => setPartyFormCompany(e.target.value)}
                          placeholder="Company name"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPartyForm(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={partyFormSubmitting}
                      >
                        {partyFormSubmitting && (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        )}
                        Add Party
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Parties list */}
            {partiesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : parties.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="mx-auto h-10 w-10 text-neutral-300" />
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    No parties added yet
                  </p>
                  <p className="mt-1 text-xs text-neutral-400">
                    Add collaborators to this permit
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {parties.map((party) => (
                  <div
                    key={party.id}
                    className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-semibold text-primary-700">
                        {party.contact.name?.[0]?.toUpperCase() ?? "U"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-neutral-900">
                            {party.contact.name}
                          </p>
                          <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                            {PARTY_ROLE_LABELS[party.role] ?? party.role}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-4 text-xs text-neutral-500">
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {party.contact.email}
                          </span>
                          {party.contact.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {party.contact.phone}
                            </span>
                          )}
                          {party.contact.company && (
                            <span className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {party.contact.company}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParty(party.id)}
                      disabled={removingPartyId === party.id}
                      className="text-neutral-400 hover:text-red-600"
                    >
                      {removingPartyId === party.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
