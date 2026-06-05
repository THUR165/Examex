from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Disciplina, Topico, Questao, Alternativa, Simulado, RespostaAluno

# 1. Configuração do Usuário
class UsuarioCustomAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (
        ('Perfil no Examex', {'fields': ('is_professor',)}),
    )

# 2. Configurações da Questão
class AlternativaInline(admin.TabularInline):
    model = Alternativa
    extra = 4

class QuestaoAdmin(admin.ModelAdmin):
    list_display = ('enunciado', 'topico', 'tipo', 'peso')
    inlines = [AlternativaInline]

admin.site.register(Usuario, UsuarioCustomAdmin) 
admin.site.register(Disciplina)
admin.site.register(Topico)
admin.site.register(Questao, QuestaoAdmin)
admin.site.register(Simulado)
admin.site.register(RespostaAluno)