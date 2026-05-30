from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Disciplina, Topico, Questao, Alternativa

admin.site.register(Usuario, UserAdmin)
admin.site.register(Disciplina)
admin.site.register(Topico)
class AlternativaInline(admin.TabularInline):
    model = Alternativa
    extra = 4

class QuestaoAdmin(admin.ModelAdmin):
    list_display = ('enunciado', 'topico', 'tipo', 'peso')
    inlines = [AlternativaInline]

admin.site.register(Questao, QuestaoAdmin)