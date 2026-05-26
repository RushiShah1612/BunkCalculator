import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { PageWrapper } from "../components/layout/PageWrapper"
import { useSubjects } from "../hooks/useSubjects"
import { SubjectModal } from "../components/shared/SubjectModal"
import { ConfirmDialog } from "../components/shared/ConfirmDialog"
import { EmptyState } from "../components/shared/EmptyState"
import { Button } from "../components/ui/button"
import { Plus, Edit3, Trash2, BookOpen, ExternalLink } from "lucide-react"
import type { Subject } from "../types"

// Pulse Card Skeleton
function SubjectCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-3xl p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="w-20 h-4 bg-muted rounded-full"></div>
        <div className="w-12 h-4 bg-muted rounded-full"></div>
      </div>
      <div className="w-3/4 h-6 bg-muted rounded-lg"></div>
      <div className="space-y-2 pt-2">
        <div className="w-full h-3 bg-muted rounded-full"></div>
        <div className="w-5/6 h-3 bg-muted rounded-full"></div>
      </div>
      <div className="flex justify-end space-x-2 pt-4">
        <div className="w-8 h-8 bg-muted rounded-xl"></div>
        <div className="w-8 h-8 bg-muted rounded-xl"></div>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  const { subjects, loading, fetchSubjects, createSubject, updateSubject, deleteSubject } = useSubjects()
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Delete dialog state
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Fetch subjects and set title on mount
  useEffect(() => {
    document.title = "Subjects | RollCall"
    fetchSubjects()
  }, [fetchSubjects])

  const handleOpenAddModal = () => {
    setEditingSubject(null)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject)
    setIsModalOpen(true)
  }

  const handleModalSubmit = async (formData: unknown) => {
    setModalLoading(true)
    try {
      if (editingSubject) {
        await updateSubject(editingSubject.id, formData as Parameters<typeof updateSubject>[1])
      } else {
        await createSubject(formData as Parameters<typeof createSubject>[0])
      }
      setIsModalOpen(false)
    } finally {
      setModalLoading(false)
    }
  }

  const handleOpenDeleteDialog = (subject: Subject) => {
    setDeletingSubject(subject)
    setIsDeleteOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSubject) return
    setDeleteLoading(true)
    try {
      await deleteSubject(deletingSubject.id)
      setIsDeleteOpen(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <PageWrapper title="Subjects">
      {/* Header Panel */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Course Catalog</h2>
          <p className="text-sm text-muted-foreground">Manage your curriculum and class hours</p>
        </div>
        {subjects.length > 0 && (
          <Button 
            onClick={handleOpenAddModal}
            className="rounded-xl flex items-center space-x-1 shadow-lg shadow-primary/10"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </Button>
        )}
      </div>

      {/* Main Grid View */}
      {loading && subjects.length === 0 ? (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <SubjectCardSkeleton />
          <SubjectCardSkeleton />
          <SubjectCardSkeleton />
        </div>
      ) : subjects.length === 0 ? (
        <div className="py-12 animate-in fade-in duration-300">
          <EmptyState
            icon={BookOpen}
            title="Add your first subject"
            description="Register a subject to configure your semester expectations, total lecture hours, and minimum attendance thresholds."
            actionLabel="Add Subject"
            onAction={handleOpenAddModal}
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 animate-in fade-in duration-300">
          {subjects.map((sub) => {

            return (
              <div
                key={sub.id}
                className="bg-card border-l-4 border border-t-border border-r-border border-b-border rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                style={{ borderLeftColor: sub.color_tag }}
              >
                {/* Header info */}
                <div className="p-4 md:p-6 pb-2 md:pb-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate max-w-[120px]">
                      {sub.code || "No Code"}
                    </span>
                    <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full font-bold">
                      {sub.credits ? `${sub.credits} Credits · ` : ""}{sub.min_attendance ?? 75}% Req
                    </span>
                  </div>
                  <h3 className="text-sm md:text-lg font-bold text-foreground mb-1 leading-snug line-clamp-1">
                    {sub.name}
                  </h3>
                  <span className="text-[10px] md:text-xs text-muted-foreground">{sub.semester || "No Semester"}</span>
                </div>

                {/* Class component lists */}
                <div className="px-4 md:px-6 py-2.5 md:py-4 border-t border-b border-border/40 bg-muted/10 space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Class Components
                  </span>
                  <div className="space-y-1">
                    {sub.class_types.map((type) => {
                      const sessions = 
                        type.total_hours && type.hours_per_session 
                          ? Math.round((type.total_hours / type.hours_per_session) * 10) / 10 
                          : 0
                      return (
                        <div key={type.id} className="flex justify-between items-center text-[10px] md:text-xs">
                          <span className="font-semibold text-foreground/80">{type.name}</span>
                          <span className="text-muted-foreground">
                            {type.total_hours} hrs · {sessions} sessions
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Footer status summary & Actions */}
                <div className="p-3 md:p-4 px-4 md:px-6 flex justify-between items-center bg-card">
                  <Link
                    to={`/subjects/${sub.id}`}
                    className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Details
                  </Link>
                  <div className="flex space-x-1">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleOpenEditModal(sub)}
                      className="rounded-xl h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => handleOpenDeleteDialog(sub)}
                      className="rounded-xl h-8 w-8 hover:bg-danger/10 text-muted-foreground hover:text-danger"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit/Create Dialog Modal */}
      <SubjectModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
        subject={editingSubject}
        loading={modalLoading}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        title={`Delete Subject "${deletingSubject?.name}"?`}
        description="Deleting this subject will also delete all attendance records for it. This cannot be undone."
        confirmLabel={deleteLoading ? "Deleting..." : "Delete Subject"}
        confirmTextMatch={deletingSubject?.name}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteOpen(false)}
        variant="destructive"
      />
    </PageWrapper>
  )
}
