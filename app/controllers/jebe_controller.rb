class JebeController < ApplicationController

  def index
  end

  def simulator
  	file = File.dirname($0) + '../../template/setting.html'
    @setting = IO.read(file)
    file = File.dirname($0) + '../../template/runtime.html'
    @runtime = IO.read(file)
    @runtime.gsub! /\n/, ''
    @runtime.gsub! /\//, '\\/'
    respond_to do |format|
      format.html
    end
  end

  def runtime
  	render :layout => 'runtime'
  end

  def preview
  	render :layout => 'runtime'
  end

  def template
    require 'rexml/document'
    tmplInfo = params[:info].split('-')
    tmplVar = tmplInfo.pop
    tmplData = []
    tmplInfo.each do |tmpl|
      tmplId = tmpl.split(',')[0]
      xml = REXML::Document.new File.read 'd:/ad/widgets/widget/trunk/' + tmplId + '/1/' + tmplId + '.xml' if File.exist? 'd:/ad/widgets/widget/trunk/' + tmplId + '/1/' + tmplId + '.xml'
      render :text => xml.root and return
      xml.elements.each 'Module/Content/Init' do |content|
        render :text => content.first.text and return
      end
      tmplData.push 1
    end
    #render :js => 'var' + tmplVar + '=' + tmplData
  end

  def upload
  	require 'fileutils'
    tmp = params[:pic].tempfile
    file = File.join('public/files', params[:pic].original_filename)
    FileUtils.cp tmp.path, file
    render :json => {files: ['/files/'+params[:pic].original_filename]}
  end

end

  