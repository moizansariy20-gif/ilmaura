
import { UserProfile, StaffPermission } from '../types.ts';

export const usePermissions = (profile: UserProfile | null) => {
  const isPrincipal = profile?.role === 'principal';
  const isMotherAdmin = profile?.role === 'mother-admin';
  const isStaff = profile?.role === 'staff';

  const hasPermission = (sectionId: string, action: keyof StaffPermission): boolean => {
    if (isPrincipal || isMotherAdmin) return true;
    if (!isStaff || !profile?.staffPermissions) return false;
    
    const sectionPerms = profile.staffPermissions[sectionId];
    if (!sectionPerms) return false;
    
    return sectionPerms[action];
  };

  return {
    isPrincipal,
    isMotherAdmin,
    isStaff,
    hasPermission,
    canView: (sectionId: string) => hasPermission(sectionId, 'view'),
    canAdd: (sectionId: string) => hasPermission(sectionId, 'add'),
    canEdit: (sectionId: string) => hasPermission(sectionId, 'edit'),
    canDelete: (sectionId: string) => hasPermission(sectionId, 'delete'),
  };
};
