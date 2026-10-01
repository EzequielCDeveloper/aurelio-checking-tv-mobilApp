import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { Badge } from '../components/Badge';
import { theme } from '../styles/theme';

export const OnboardingView: React.FC = () => {
  const { invitations, createInvitation, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);

  const handleGenerate = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      showToast('Ingresa un correo electrónico válido', 'error');
      return;
    }

    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      showToast('El formato del correo es inválido', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const inv = await createInvitation(trimmed);
      const link = `https://asistenciapro.com/onboarding/registro?token=${inv.token}`;
      setLastGeneratedLink(link);
      setEmail('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = (linkText: string) => {
    showToast('Enlace copiado al portapapeles', 'info');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Invitation Form Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail-open-outline" size={24} color={theme.colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.cardTitle}>Generar y Enviar Link de Onboarding</Text>
            <Text style={styles.cardSubtitle}>
              Envía una invitación digital para que el nuevo colaborador configure su perfil y biometría.
            </Text>
          </View>
        </View>

        <View style={styles.formRow}>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="correo.nuevo.empleado@empresa.com"
              placeholderTextColor={theme.colors.textFaint}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleGenerate}
            />
          </View>

          <Pressable
            onPress={handleGenerate}
            style={[styles.generateBtn, isSubmitting && styles.btnDisabled]}
            disabled={isSubmitting}
          >
            <Ionicons name="paper-plane" size={16} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.generateBtnText}>
              {isSubmitting ? 'Enviando...' : 'Generar y Enviar Link'}
            </Text>
          </Pressable>
        </View>

        {/* Recently Generated Link Alert */}
        {lastGeneratedLink ? (
          <View style={styles.linkGeneratedBox}>
            <View style={styles.linkTop}>
              <Ionicons name="checkmark-circle" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.linkTitle}>¡Link de invitación generado con éxito!</Text>
            </View>
            <View style={styles.linkContentRow}>
              <Text style={styles.linkText} numberOfLines={1}>
                {lastGeneratedLink}
              </Text>
              <Pressable onPress={() => handleCopy(lastGeneratedLink)} style={styles.copyBtn}>
                <Ionicons name="copy-outline" size={14} color="#FFF" style={{ marginRight: 4 }} />
                <Text style={styles.copyBtnText}>Copiar</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>

      {/* Invitations History Card */}
      <View style={[styles.card, { marginTop: theme.spacing.lg }]}>
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Invitaciones Enviadas</Text>
          <Text style={styles.historyCount}>{invitations.length} invitaciones registradas</Text>
        </View>

        {/* List Header */}
        <View style={styles.listHead}>
          <Text style={[styles.listTh, { flex: 3 }]}>Correo Electrónico</Text>
          <Text style={[styles.listTh, { flex: 2.5 }]}>Token de Registro</Text>
          <Text style={[styles.listTh, { flex: 2 }]}>Fecha</Text>
          <Text style={[styles.listTh, { flex: 1.5 }]}>Estado</Text>
          <Text style={[styles.listTh, { width: 100, textAlign: 'center' }]}>Acciones</Text>
        </View>

        {/* Rows */}
        {invitations.map((inv) => (
          <View key={inv.id} style={styles.listRow}>
            {/* Email */}
            <View style={[styles.listTd, { flex: 3, flexDirection: 'row', alignItems: 'center' }]}>
              <View style={styles.emailDot} />
              <Text style={styles.emailText}>{inv.email}</Text>
            </View>

            {/* Token */}
            <View style={[styles.listTd, { flex: 2.5 }]}>
              <Text style={styles.tokenText}>{inv.token}</Text>
            </View>

            {/* Fecha */}
            <View style={[styles.listTd, { flex: 2 }]}>
              <Text style={styles.dateText}>
                {new Date(inv.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Text>
            </View>

            {/* Estado */}
            <View style={[styles.listTd, { flex: 1.5 }]}>
              <Badge
                label={inv.estado}
                variant={inv.estado === 'Registrado' ? 'success' : 'warning'}
              />
            </View>

            {/* Acciones */}
            <View style={[styles.listTd, { width: 100, flexDirection: 'row', justifyContent: 'center' }]}>
              <Pressable
                onPress={() =>
                  handleCopy(`https://asistenciapro.com/onboarding/registro?token=${inv.token}`)
                }
                style={styles.copyRowBtn}
              >
                <Ionicons name="copy-outline" size={14} color={theme.colors.textMuted} />
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  content: {
    padding: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.bgCard,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.xl,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  cardSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  inputWrapper: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    height: 46,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 14,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: theme.radius.md,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    height: 46,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  generateBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  linkGeneratedBox: {
    marginTop: theme.spacing.lg,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: theme.radius.md,
    padding: 14,
  },
  linkTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  linkTitle: {
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  linkContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: theme.radius.sm,
  },
  linkText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    flex: 1,
    marginRight: 10,
    fontFamily: 'monospace',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: theme.radius.sm,
  },
  copyBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  historyCount: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  listHead: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: theme.radius.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listTh: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(51, 65, 85, 0.4)',
  },
  listTd: {
    justifyContent: 'center',
  },
  emailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.blue,
    marginRight: 8,
  },
  emailText: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  tokenText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontFamily: 'monospace',
  },
  dateText: {
    color: theme.colors.textFaint,
    fontSize: 12,
  },
  copyRowBtn: {
    padding: 6,
    borderRadius: theme.radius.sm,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
});
